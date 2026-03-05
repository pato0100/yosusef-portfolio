import { useEffect, useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import AdminLayout from "../admin/AdminLayout"

export default function Admin(){

const [loading,setLoading] = useState(true)
const [isAdmin,setIsAdmin] = useState(false)

useEffect(()=>{

async function checkAdmin(){

const { data:userData } = await supabase.auth.getUser()

if(!userData?.user){
setLoading(false)
return
}

const { data:profile } = await supabase
.from("profiles")
.select("is_admin")
.eq("id",userData.user.id)
.single()

if(profile?.is_admin){
setIsAdmin(true)
}

setLoading(false)

}

checkAdmin()

},[])

if(loading){
return <div className="p-6">Loading...</div>
}

if(!isAdmin){
return <Navigate to="/" replace />
}

return (

<AdminLayout>

<Outlet/>

</AdminLayout>

)

}