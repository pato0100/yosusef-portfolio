import { supabase } from "../lib/supabase"

export async function validateInvite(code){

const { data, error } = await supabase
.from("invites")
.select("*")
.eq("code",code)
.single()

if(error || !data){
throw new Error("Invalid invite")
}

const now = new Date()

if(data.expires_at && new Date(data.expires_at) < now){
throw new Error("Invite expired")
}

if(data.max_uses && data.used_count >= data.max_uses){
throw new Error("Invite already used")
}

return data
}