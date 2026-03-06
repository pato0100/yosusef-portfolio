import { useEffect,useState } from "react"
import { useSearchParams } from "react-router-dom"
import { validateInvite } from "../services/signup"

export default function Signup(){

const [params] = useSearchParams()
const inviteCode = params.get("invite")

const [invite,setInvite] = useState(null)
const [loading,setLoading] = useState(true)
const [error,setError] = useState(null)

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
    method: "POST",
    headers: {
      "Content-Type": "application/json",

      // مهم جدا لتمرير سياسة Edge Functions
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,

      // ده السر اللي بتشيّك عليه في الـ Edge Function
      "x-admin-secret": import.meta.env.VITE_ADMIN_SECRET
    },
    body: JSON.stringify({
      email,
      password,
      inviteCode
    })
  }
)

const data = await res.json()

if(data.error){
alert(data.error)
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