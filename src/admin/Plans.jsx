import { useEffect, useState } from "react"
import { getPlans, createPlan } from "../services/plans"

export default function Plans(){

const [plans,setPlans] = useState([])

const [form,setForm] = useState({
name:"",
price:0,
max_projects:3,
max_gallery_images:10,
contact_daily_limit:20,
storage_limit_mb:100
})

async function load(){

const data = await getPlans()

setPlans(data)

}

useEffect(()=>{
load()
},[])

async function handleCreate(){

await createPlan(form)

await load()

}

return(

<div>

<h1 className="text-2xl font-bold mb-6">
Plans
</h1>

{/* Create plan */}

<div className="grid grid-cols-3 gap-3 mb-6">

<input
placeholder="Name"
className="input"
onChange={(e)=>setForm({...form,name:e.target.value})}
/>

<input
placeholder="Price"
className="input"
type="number"
onChange={(e)=>setForm({...form,price:e.target.value})}
/>

<input
placeholder="Max projects"
className="input"
type="number"
onChange={(e)=>setForm({...form,max_projects:e.target.value})}
/>

<input
placeholder="Max images"
className="input"
type="number"
onChange={(e)=>setForm({...form,max_gallery_images:e.target.value})}
/>

<input
placeholder="Contact/day"
className="input"
type="number"
onChange={(e)=>setForm({...form,contact_daily_limit:e.target.value})}
/>

<input
placeholder="Storage MB"
className="input"
type="number"
onChange={(e)=>setForm({...form,storage_limit_mb:e.target.value})}
/>

<button
onClick={handleCreate}
className="btn btn-primary"
>
Create Plan
</button>

</div>

{/* Plans list */}

<table className="w-full text-sm">

<thead>

<tr className="border-b border-white/10">

<th>Name</th>
<th>Price</th>
<th>Projects</th>
<th>Images</th>
<th>Contact</th>

</tr>

</thead>

<tbody>

{plans.map(plan => (

<tr key={plan.id}>

<td>{plan.name}</td>

<td>{plan.price}</td>

<td>{plan.max_projects}</td>

<td>{plan.max_gallery_images}</td>

<td>{plan.contact_daily_limit}</td>

</tr>

))}

</tbody>

</table>

</div>

)

}