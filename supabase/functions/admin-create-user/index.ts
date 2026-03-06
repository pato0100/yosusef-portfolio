import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-admin-secret, content-type"
}

// rate limit map
const ipRequests = new Map()



serve(async (req) => {

if(req.method === "OPTIONS"){
  return new Response("ok",{headers:corsHeaders})
}

try{

const ip = req.headers.get("x-forwarded-for") || "unknown"

// simple rate limit
const now = Date.now()
const last = ipRequests.get(ip)

if(last && now - last < 5000){
  return new Response(JSON.stringify({
    error:"Too many requests"
  }),{status:429,headers:corsHeaders})
}

ipRequests.set(ip,now)

const adminSecret = req.headers.get("x-admin-secret")

if(adminSecret !== Deno.env.get("ADMIN_SECRET")){
  return new Response(JSON.stringify({
    error:"Unauthorized"
  }),{status:401,headers:corsHeaders})
}



const {
firstName,
lastName,
username,
slug: userSlug,
email,
password,
inviteCode
} = await req.json()


if(!email || !password || !inviteCode){
  return new Response(JSON.stringify({
    error:"Missing fields"
  }),{status:400,headers:corsHeaders})
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

// ======================
// validate invite
// ======================

const { data:invite,error:inviteError } = await supabase
.from("invites")
.select("*")
.eq("code",inviteCode)
.single()

if(inviteError || !invite){
  return new Response(JSON.stringify({
    error:"Invalid invite"
  }),{status:400,headers:corsHeaders})
}

const nowDate = new Date()

if(invite.expires_at && new Date(invite.expires_at) < nowDate){
  return new Response(JSON.stringify({
    error:"Invite expired"
  }),{status:400,headers:corsHeaders})
}

if(invite.max_uses && invite.used_count >= invite.max_uses){
  return new Response(JSON.stringify({
    error:"Invite already used"
  }),{status:400,headers:corsHeaders})
}

//pp


const slug = (userSlug || username)
.toLowerCase()
.replace(/[^a-z0-9-]/g,"")

// ======================
// check slug
// ======================

const { data:existingSlug } = await supabase
.from("profiles")
.select("id")
.eq("slug",slug)
.maybeSingle()

if(existingSlug){
return new Response(JSON.stringify({
error:"Slug already taken"
}),{status:400,headers:corsHeaders})
}

// ======================
// check username
// ======================

const { data:existingUsername } = await supabase
.from("profiles")
.select("id")
.eq("username",username)
.maybeSingle()

if(existingUsername){
return new Response(JSON.stringify({
error:"Username already taken"
}),{status:400,headers:corsHeaders})
}



// ======================
// create user
// ======================

const { data:user,error:userError } =
await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm:false
})

if(userError){
  return new Response(JSON.stringify({
    error:userError.message
  }),{status:400,headers:corsHeaders})
}

const fullName = `${firstName || ""} ${lastName || ""}`.trim()



// ======================
// create profile
// ======================

const { error:profileError } = await supabase
.from("profiles")
.insert({
id: user.user.id,
email: email,
slug: slug,
username: username,
name_en: fullName
})

if(profileError){
return new Response(JSON.stringify({
error: profileError.message
}),{status:400,headers:corsHeaders})
}

// ======================
// create settings
// ======================

await supabase.from("settings").insert({
  owner_id:user.user.id,
  default_lang:"en",
  default_theme:"dark"
})

// ======================
// subscription
// ======================

if(invite.plan_id){

await supabase.from("subscriptions").insert({
  user_id:user.user.id,
  plan_id:invite.plan_id,
  status:"active",
  start_date:new Date()
})

}

// ======================
// update invite usage
// ======================

await supabase
.from("invites")
.update({
used_count: invite.used_count + 1
})
.eq("id",invite.id)
.select()

return new Response(JSON.stringify({
  success:true,
  slug
}),{headers:corsHeaders})

}catch(e){

return new Response(JSON.stringify({
  error:e.message
}),{status:500,headers:corsHeaders})

}

})