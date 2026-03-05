import { supabase } from "../lib/supabase"

function generateCode(){

return Math.random()
.toString(36)
.substring(2,10)

}

export async function createInvite(planId){

const code = generateCode()

const { data:user } = await supabase.auth.getUser()

const { data, error } = await supabase
.from("invites")
.insert({
code,
plan_id:planId,
created_by:user.user.id
})
.select()
.single()

if(error) throw error

return data

}

export async function getInvites(){

const { data, error } = await supabase
.from("invites")
.select(`
id,
code,
used_count,
max_uses,
expires_at,
plans(name)
`)
.order("created_at",{ascending:false})

if(error) throw error

return data

}