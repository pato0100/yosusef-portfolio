import { useEffect, useState } from "react"
import { createInvite, getInvites } from "../services/invites"

export default function Invites(){

const [invites,setInvites] = useState([])

async function load(){

const data = await getInvites()

setInvites(data)

}

useEffect(()=>{
load()
},[])

async function handleCreate(){

const invite = await createInvite(null)

await load()

alert("Invite created")

}

return(

<div>

<h1 className="text-2xl font-bold mb-6">
Invites
</h1>

<button
onClick={handleCreate}
className="btn btn-primary mb-6"
>
Create Invite
</button>

<table className="w-full text-sm">

<thead>

<tr className="border-b border-white/10">

<th className="p-2 text-left">Code</th>

<th className="p-2 text-left">Uses</th>

<th className="p-2 text-left">Link</th>

</tr>

</thead>

<tbody>

{invites.map(invite => (

<tr key={invite.id}>

<td className="p-2">
{invite.code}
</td>

<td className="p-2">
{invite.used_count}/{invite.max_uses}
</td>

<td className="p-2">

<a
href={`/signup?invite=${invite.code}`}
target="_blank"
>

/signup?invite={invite.code}

</a>

</td>

</tr>

))}

</tbody>

</table>

</div>

)

}