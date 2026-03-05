import { useEffect, useState } from "react"
import { getUsers } from "../services/admin"

export default function Users(){

const [users,setUsers] = useState([])
const [search,setSearch] = useState("")
const [loading,setLoading] = useState(true)

async function load(){

setLoading(true)

const data = await getUsers(search)

setUsers(data)

setLoading(false)

}

useEffect(()=>{
load()
},[])

return(

<div>

<h1 className="text-2xl font-bold mb-6">
Users
</h1>

<input
className="input mb-4"
placeholder="Search email..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
/>

<button
onClick={load}
className="btn btn-primary mb-6"
>
Search
</button>

<table className="w-full text-sm">

<thead>

<tr className="border-b border-white/10">

<th className="text-left p-2">Email</th>

<th className="text-left p-2">Slug</th>

<th className="text-left p-2">Admin</th>

<th className="text-left p-2">Status</th>

<th className="text-left p-2">Actions</th>

</tr>

</thead>

<tbody>

{loading && (

<tr>

<td colSpan="5">Loading...</td>

</tr>

)}

{users.map(user => (

<tr
key={user.id}
className="border-b border-white/5"
>

<td className="p-2">{user.email}</td>

<td className="p-2">{user.slug}</td>

<td className="p-2">
{user.is_admin ? "Yes" : "No"}
</td>

<td className="p-2">
{user.is_banned ? "Banned" : "Active"}
</td>

<td className="p-2 flex gap-2">

<button className="btn btn-outline">
Edit
</button>

<button className="btn btn-outline">
Ban
</button>

<button className="btn btn-outline">
Delete
</button>

</td>

</tr>

))}

</tbody>

</table>

</div>

)

}