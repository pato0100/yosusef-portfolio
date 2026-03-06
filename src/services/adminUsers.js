import { supabase } from "../lib/supabase"


// 🔎 Get users with pagination + search
export async function getUsers(page = 1, search = "") {

const limit = 10
const from = (page - 1) * limit
const to = from + limit - 1

let query = supabase
.from("profiles")
.select("id,email,slug,is_admin,banned,created_at",{count:"exact"})
.range(from,to)
.order("created_at",{ascending:false})

if(search){
query = query.ilike("email",`%${search}%`)
}

const { data,count,error } = await query

if(error) throw error

return {
users:data || [],
total:count || 0
}

}



// 🗑 Delete user
export async function deleteUser(id){

const { error } = await supabase
.from("profiles")
.delete()
.eq("id",id)

if(error) throw error

}



// 🚫 Ban user
export async function banUser(id){

const { error } = await supabase
.from("profiles")
.update({ banned:true })
.eq("id",id)

if(error) throw error

}



// ✅ Unban user
export async function unbanUser(id){

const { error } = await supabase
.from("profiles")
.update({ banned:false })
.eq("id",id)

if(error) throw error

}



// ⏳ Extend subscription 1 month
export async function extendSubscription(userId){

const newDate = new Date()
newDate.setMonth(newDate.getMonth() + 1)

const { error } = await supabase
.from("subscriptions")
.update({
end_date:newDate
})
.eq("user_id",userId)

if(error) throw error

}


// 👤 Get single user details
export async function getUserDetails(userId){

const { data, error } = await supabase
.from("profiles")
.select(`
id,
email,
slug,
banned,
projects_count,
storage_used_mb,
created_at,
subscriptions (
id,
status,
start_date,
end_date,
plans (
name,
max_projects,
storage_limit_mb
)
),
projects (
id,
title,
created_at
)
`)
.eq("id",userId)
.single()

if(error) throw error

return data

}