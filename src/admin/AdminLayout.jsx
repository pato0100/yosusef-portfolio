import { Link, Outlet } from "react-router-dom"

export default function AdminLayout(){

    

return(

<div className="flex min-h-screen">

{/* Sidebar */}

<div className="w-64 border-r border-white/10 p-4">

<h2 className="text-xl font-bold mb-6">
Admin Panel
</h2>

<nav className="flex flex-col gap-2">

<Link to="/admin">Dashboard</Link>

<Link to="/admin/users">Users</Link>

<Link to="/admin/invites">Invites</Link>

<Link to="/admin/plans">Plans</Link>

</nav>

</div>

{/* Content */}

<div className="flex-1 p-6">

<Outlet/>

</div>

</div>

)

}


