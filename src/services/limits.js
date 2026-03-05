import { supabase } from "../lib/supabase"

export async function getMyLimits(){

const { data:user } = await supabase.auth.getUser()

const { data } = await supabase
.from("subscriptions")
.select(`
plans (
max_projects,
max_gallery_images,
contact_daily_limit,
storage_limit_mb
)
`)
.eq("user_id",user.user.id)
.single()

return data?.plans

}