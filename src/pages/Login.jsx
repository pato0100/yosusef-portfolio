import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Login() {

  const navigate = useNavigate()

  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const [err,setErr] = useState("")
  const [loading,setLoading] = useState(false)

  async function signIn(e) {
  e.preventDefault()

  try {

    setLoading(true)
    setErr('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    // 🔥 جيب البروفايل
    const { data: profile } = await supabase
      .from("profiles")
      .select("slug")
      .eq("id", data.user.id)
      .single()

    if (!profile?.slug) {
      navigate("/onboarding")
      return
    }

    navigate(`/${profile.slug}/edit`)

  } catch (e) {
    setErr(e.message)
  } finally {
    setLoading(false)
  }
}

  return(
    <div className="min-h-screen flex items-center justify-center p-4">

      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg">

        <h2 className="text-xl font-bold mb-2">
          Admin Login
        </h2>

        {err && (
          <div className="text-xs text-red-400 mb-3">
            {err}
          </div>
        )}

        <form onSubmit={signIn} className="space-y-3">

          <input
            type="email"
            placeholder="Email"
            className="input w-full"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="input w-full"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button
            type="submit"
            className="w-full btn btn-primary"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>

        </form>

        <a
  href="/forgot-password"
  className="text-xs opacity-70 hover:underline"
>
  Forgot password?
</a>

      </div>

    </div>
  )
}