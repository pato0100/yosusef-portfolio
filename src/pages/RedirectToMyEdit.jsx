import { useEffect } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function RedirectToMyEdit(){

const navigate = useNavigate()

useEffect(()=>{

async function go(){

const { data:userData } = await supabase.auth.getUser()

const uid = userData?.user?.id

if(!uid){
navigate("/login")
return
}

const { data:profile } = await supabase
.from("profiles")
.select("slug")
.eq("id",uid)
.single()

if(!profile?.slug){
navigate("/onboarding")
return
}

navigate(`/${profile.slug}/edit`,{replace:true})

}

go()

},[])

return (
<div className="min-h-screen flex items-center justify-center">
Loading...
</div>
)

}