import { supabase } from "../lib/supabase"

export async function getPlans(){

const { data, error } = await supabase
.from("plans")
.select("*")
.order("price",{ascending:true})

if(error) throw error

return data

}

export async function createPlan(values){

const { data, error } = await supabase
.from("plans")
.insert(values)
.select()
.single()

if(error) throw error

return data

}


export async function updatePlan(id,values){

const { error } = await supabase
.from("plans")
.update(values)
.eq("id",id)

if(error) throw error

}


export async function deletePlan(id){

const { error } = await supabase
.from("plans")
.delete()
.eq("id",id)

if(error) throw error

}

