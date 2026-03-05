export default function Dashboard(){

return(

<div>

<h1 className="text-2xl font-bold mb-6">
Admin Dashboard
</h1>

<div className="grid grid-cols-4 gap-4">

<div className="card p-4">
Total Users
</div>

<div className="card p-4">
Total Projects
</div>

<div className="card p-4">
Active Subscriptions
</div>

<div className="card p-4">
Contact Messages
</div>

</div>

</div>

)

}