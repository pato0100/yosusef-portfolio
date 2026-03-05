import { supabase } from "../lib/supabase"

export async function getUsers(search=""){

let query = supabase
.from("profiles")
.select(`
id,
email,
slug,
is_admin,
is_banned
`)

if(search){
query = query.ilike("email", `%${search}%`)
}

const { data, error } = await query.limit(50)

if(error) throw error

return data

}

export async function banUser(userId){

const { error } = await supabase
.from("profiles")
.update({ is_banned:true })
.eq("id",userId)

if(error) throw error

}

export async function deleteUser(userId){

const { error } = await supabase
.from("profiles")
.delete()
.eq("id",userId)

if(error) throw error

}

export async function extendSubscription(userId,days){

const newDate = new Date()
newDate.setDate(newDate.getDate()+days)

const { error } = await supabase
.from("subscriptions")
.update({
end_date:newDate
})
.eq("user_id",userId)

if(error) throw error

}