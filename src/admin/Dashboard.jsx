import { useEffect, useState } from "react"
import { getAdminStats } from "../services/adminStats"

export default function Dashboard(){

const [stats,setStats] = useState(null)

useEffect(()=>{

async function load(){

const data = await getAdminStats()
setStats(data)

}

load()

},[])

if(!stats){
return <div>Loading...</div>
}

return(

<div>

<h1 className="text-2xl font-bold mb-6">
Admin Dashboard
</h1>

<div className="grid grid-cols-4 gap-4">

<div className="card p-4">
<div className="text-sm opacity-70">Total Users</div>
<div className="text-2xl font-bold">{stats.users}</div>
</div>

<div className="card p-4">
<div className="text-sm opacity-70">Total Projects</div>
<div className="text-2xl font-bold">{stats.projects}</div>
</div>

<div className="card p-4">
<div className="text-sm opacity-70">Active Subscriptions</div>
<div className="text-2xl font-bold">{stats.subscriptions}</div>
</div>

<div className="card p-4">
<div className="text-sm opacity-70">Contact Messages</div>
<div className="text-2xl font-bold">{stats.messages}</div>
</div>

</div>

</div>

)

}