import { supabase } from "../lib/supabase"

export async function getUsers(search=""){

let query = supabase
.from("profiles")
.select("id,email,slug,is_admin,created_at")
.order("created_at",{ascending:false})

if(search){
query = query.ilike("email",`%${search}%`)
}

const { data,error } = await query

if(error) throw error

return data

}


export async function deleteUser(id){

const { error } = await supabase
.from("profiles")
.delete()
.eq("id",id)

if(error) throw error

}


export async function banUser(id){

const { error } = await supabase
.from("profiles")
.update({ banned:true })
.eq("id",id)

if(error) throw error

}