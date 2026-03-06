import { useEffect,useState } from "react"
import { useSearchParams } from "react-router-dom"
import { validateInvite } from "../services/signup"

export default function Signup(){

const [params] = useSearchParams()
const inviteCode = params.get("invite")

const [invite,setInvite] = useState(null)
const [loading,setLoading] = useState(true)
const [error,setError] = useState(null)

const [firstName,setFirstName] = useState("")
const [lastName,setLastName] = useState("")
const [username,setUsername] = useState("")
const [slug,setSlug] = useState("")

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

useEffect(()=>{

async function check(){

if(!inviteCode){
setError("Signup is invite only")
setLoading(false)
return
}

try{

const data = await validateInvite(inviteCode)
setInvite(data)

}catch(e){

setError(e.message)

}

setLoading(false)

}

check()

},[])

async function handleSignup(e){

e.preventDefault()

const res = await fetch(
`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
{
method:"POST",
headers:{
"Content-Type":"application/json",

// مهم جدا لتمرير سياسة Edge Functions
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,

      // ده السر اللي بتشيّك عليه في الـ Edge Function
      "x-admin-secret": import.meta.env.VITE_ADMIN_SECRET


},
body:JSON.stringify({
firstName,
lastName,
username,
slug,
email,
password,
inviteCode
})
}
)

const data = await res.json()

if(!res.ok){
alert(data.error || "Signup failed")
return
}

alert("Account created. You can login now.")

}

if(loading) return <p>Checking invite...</p>
if(error) return <p>{error}</p>

return(

<div className="max-w-md mx-auto mt-20">

<h1 className="text-2xl font-bold mb-6">
Create account
</h1>

<form onSubmit={handleSignup} className="space-y-4">

<input
type="text"
placeholder="First name"
value={firstName}
onChange={e=>setFirstName(e.target.value)}
className="input"
/>

<input
type="text"
placeholder="Last name"
value={lastName}
onChange={e=>setLastName(e.target.value)}
className="input"
/>

<input
type="text"
placeholder="Username"
value={username}
onChange={e=>setUsername(e.target.value)}
className="input"
/>

<div className="flex items-center bg-black/20 border border-white/10 rounded-lg overflow-hidden">

<span className="px-3 text-sm text-white/50">
https://shofni.online/
</span>

<input
type="text"
value={slug}
onChange={e=>setSlug(e.target.value)}
className="flex-1 bg-transparent outline-none p-2"
placeholder="your-name"
/>

</div>

<input
type="email"
placeholder="Email"
value={email}
onChange={e=>setEmail(e.target.value)}
className="input"
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={e=>setPassword(e.target.value)}
className="input"
/>

<button className="btn btn-primary w-full">
Create account
</button>

</form>

</div>

)

}