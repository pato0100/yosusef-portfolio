import { useEffect, useState } from "react"
import { getUsers, deleteUser, banUser, unbanUser } from "../services/adminUsers"
import { useNavigate } from "react-router-dom"

export default function Users(){

const [users,setUsers] = useState([])
const [search,setSearch] = useState("")
const [loading,setLoading] = useState(true)
const [page,setPage] = useState(1)
const [total,setTotal] = useState(0)
const navigate = useNavigate()

const limit = 10


async function load(){

setLoading(true)

const { users,total } = await getUsers(page,search)

setUsers(users)
setTotal(total)

setLoading(false)

}


useEffect(()=>{
load()
},[page])


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


async function handleUnban(id){

await unbanUser(id)

load()

}


const totalPages = Math.ceil(total / limit)


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

<th className="p-2">Status</th>

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

<td className="p-2">

<span className={`px-2 py-1 rounded text-xs ${
u.banned ? "bg-red-600" : "bg-green-600"
}`}>
{u.banned ? "Banned" : "Active"}
</span>

</td>


<td className="p-2 flex gap-2">

<button
onClick={()=>navigate(`/admin/users/${u.id}`)}
className="px-2 py-1 bg-blue-600 rounded"
>
View
</button>

{u.banned ? (

<button
onClick={()=>handleUnban(u.id)}
className="px-2 py-1 bg-green-600 rounded"
>
Unban
</button>

) : (

<button
onClick={()=>handleBan(u.id)}
className="px-2 py-1 bg-yellow-600 rounded"
>
Ban
</button>

)}

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


{/* Pagination */}

<div className="flex gap-2 mt-6">

<button
disabled={page===1}
onClick={()=>setPage(page-1)}
className="btn"
>
Prev
</button>

<span className="px-2">
Page {page} / {totalPages}
</span>

<button
disabled={page===totalPages}
onClick={()=>setPage(page+1)}
className="btn"
>
Next
</button>

</div>


</div>

)

}