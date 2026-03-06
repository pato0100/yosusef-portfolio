import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getUserDetails, banUser, unbanUser, deleteUser, extendSubscription } from "../services/adminUsers"

export default function UserDetails(){

const { id } = useParams()

const [user,setUser] = useState(null)
const [loading,setLoading] = useState(true)

async function load(){

setLoading(true)

const data = await getUserDetails(id)

setUser(data)

setLoading(false)

}

useEffect(()=>{
load()
},[])


async function handleBan(){

await banUser(user.id)
load()

}

async function handleUnban(){

await unbanUser(user.id)
load()

}

async function handleDelete(){

if(!confirm("Delete this user?")) return

await deleteUser(user.id)

window.location.href="/admin/users"

}

async function handleExtend(){

await extendSubscription(user.id)

load()

}


if(loading){
return <div>Loading...</div>
}

const subscription = user.subscriptions?.[0]
const plan = subscription?.plans?.name || "Free"


return(

<div className="space-y-6">

<h1 className="text-2xl font-bold">
User Details
</h1>


{/* User Info */}

<div className="card p-4">

<h2 className="font-bold mb-2">
User Info
</h2>

<div>Email: {user.email}</div>
<div>Slug: {user.slug}</div>
<div>Status: {user.banned ? "Banned" : "Active"}</div>
<div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>

</div>



{/* Subscription */}

<div className="card p-4">

<h2 className="font-bold mb-2">
Subscription
</h2>

<div>Plan: {plan}</div>

<div>
End Date: {subscription?.end_date
? new Date(subscription.end_date).toLocaleDateString()
: "No subscription"}
</div>

<button
onClick={handleExtend}
className="mt-2 px-3 py-1 bg-blue-600 rounded"
>
Extend 1 Month
</button>

</div>



{/* Usage */}

<div className="card p-4">

<h2 className="font-bold mb-2">
Usage
</h2>

<div>Projects: {user.projects_count || 0}</div>
<div>Storage: {user.storage_used_mb || 0} MB</div>

</div>



{/* Projects */}

<div className="card p-4">

<h2 className="font-bold mb-2">
Projects
</h2>

{user.projects?.length === 0 && (
<div>No projects</div>
)}

<ul className="space-y-1">

{user.projects?.map(p=>(

<li key={p.id}>
{p.title}
</li>

))}

</ul>

</div>



{/* Actions */}

<div className="flex gap-2">

{user.banned ? (

<button
onClick={handleUnban}
className="px-3 py-1 bg-green-600 rounded"
>
Unban
</button>

) : (

<button
onClick={handleBan}
className="px-3 py-1 bg-yellow-600 rounded"
>
Ban
</button>

)}

<button
onClick={handleDelete}
className="px-3 py-1 bg-red-600 rounded"
>
Delete User
</button>

</div>


</div>

)

}