import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function ForgotPassword(){

  const [email,setEmail] = useState("")
  const [message,setMessage] = useState("")
  const [loading,setLoading] = useState(false)

  async function sendReset(e){
    e.preventDefault()

    try{

      setLoading(true)

      const { error } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/reset-password`
        }
      )

      if(error) throw error

      setMessage("Check your email for reset link")

    }catch(err){

      setMessage(err.message)

    }finally{

      setLoading(false)

    }
  }

  return(
    <div className="min-h-screen flex items-center justify-center">

      <form
        onSubmit={sendReset}
        className="card p-6 w-full max-w-md space-y-3"
      >

        <h2 className="text-xl font-bold">
          Reset Password
        </h2>

        <input
          type="email"
          placeholder="Email"
          className="input"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
        />

        <button
          className="btn btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        {message && (
          <p className="text-sm opacity-70">
            {message}
          </p>
        )}

      </form>

    </div>
  )
}