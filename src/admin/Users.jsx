import { useEffect, useState } from "react"
import { getUsers, deleteUser, banUser } from "../services/adminUsers"

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


async function handleDelete(id){

if(!confirm("Delete this user?")) return

await deleteUser(id)

load()

}


async function handleBan(id){

if(!confirm("Ban this user?")) return

await banUser(id)

load()

}


return(

<div>

<h1 className="text-2xl font-bold mb-6">
Users
</h1>

<input
className="input mb-4"
placeholder="Search by email"
value={search}
onChange={(e)=>setSearch(e.target.value)}
onKeyDown={(e)=> e.key==="Enter" && load()}
/>

{loading && <div>Loading...</div>}

<table className="w-full text-left">

<thead>

<tr className="border-b border-white/10">

<th className="p-2">Email</th>

<th className="p-2">Slug</th>

<th className="p-2">Admin</th>

<th className="p-2">Actions</th>

</tr>

</thead>

<tbody>

{users.map(u=>(

<tr key={u.id} className="border-b border-white/5">

<td className="p-2">{u.email}</td>

<td className="p-2">{u.slug}</td>

<td className="p-2">
{u.is_admin ? "Yes" : "No"}
</td>

<td className="p-2 flex gap-2">

<button
onClick={()=>handleBan(u.id)}
className="px-2 py-1 bg-yellow-600 rounded"
>
Ban
</button>

<button
onClick={()=>handleDelete(u.id)}
className="px-2 py-1 bg-red-600 rounded"
>
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