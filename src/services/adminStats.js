import { supabase } from "../lib/supabase"

export async function getAdminStats(){

const { count:users } = await supabase
.from("profiles")
.select("*",{count:"exact",head:true})

const { count:projects } = await supabase
.from("projects")
.select("*",{count:"exact",head:true})

const { count:messages } = await supabase
.from("contact_messages")
.select("*",{count:"exact",head:true})

const { count:subscriptions } = await supabase
.from("subscriptions")
.select("*",{count:"exact",head:true})

return {
users: users || 0,
projects: projects || 0,
messages: messages || 0,
subscriptions: subscriptions || 0
}

}