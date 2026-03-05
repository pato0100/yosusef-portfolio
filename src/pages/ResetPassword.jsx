import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function ResetPassword(){

  const navigate = useNavigate()

  const [password,setPassword] = useState("")
  const [loading,setLoading] = useState(false)
  const [msg,setMsg] = useState("")

  async function updatePassword(e){

    e.preventDefault()

    try{

      setLoading(true)

      const { error } =
        await supabase.auth.updateUser({
          password
        })

      if(error) throw error

      setMsg("Password updated successfully")

      setTimeout(()=>{
        navigate("/login")
      },1500)

    }catch(err){

      setMsg(err.message)

    }finally{

      setLoading(false)

    }

  }

  return(
    <div className="min-h-screen flex items-center justify-center">

      <form
        onSubmit={updatePassword}
        className="card p-6 w-full max-w-md space-y-3"
      >

        <h2 className="text-xl font-bold">
          New Password
        </h2>

        <input
          type="password"
          placeholder="New password"
          className="input"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        {msg && (
          <p className="text-sm opacity-70">
            {msg}
          </p>
        )}

      </form>

    </div>
  )
}