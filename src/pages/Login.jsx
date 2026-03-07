import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import { useI18n } from "../i18n/i18n"

function getLocalizedAuthError(message, t) {
  const normalized = String(message || "").toLowerCase()

  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid credentials")
  ) {
    return t.login_invalid_credentials
  }

  if (normalized.includes("email not confirmed")) {
    return t.login_email_not_confirmed
  }

  if (
    normalized.includes("too many requests") ||
    normalized.includes("rate limit")
  ) {
    return t.login_too_many_requests
  }

  return t.login_unexpected_error
}

export default function Login() {
  const navigate = useNavigate()
  const { t, lang } = useI18n()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)

  const isRTL = lang === "ar"

  async function signIn(e) {
    e.preventDefault()

    try {
      setLoading(true)
      setErr("")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("slug, banned")
        .eq("id", data.user.id)
        .single()

      if (profileError) {
        throw profileError
      }

      if (profile?.banned) {
        await supabase.auth.signOut()
        setErr(t.login_banned)
        return
      }

      if (!profile?.slug) {
        navigate("/onboarding")
        return
      }

      navigate(`/${profile.slug}/edit`)
    } catch (e) {
      console.error("Login error:", e)
      setErr(getLocalizedAuthError(e?.message, t))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg">
        <h2 className={`text-xl font-bold mb-4 ${isRTL ? "text-right" : ""}`}>
          {t.login_title}
        </h2>

        {err && (
          <div className={`text-sm text-red-400 mb-3 ${isRTL ? "text-right" : ""}`}>
            {err}
          </div>
        )}

        <form onSubmit={signIn} className="space-y-3">
          <input
            type="email"
            placeholder={t.login_email}
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />

          <input
            type="password"
            placeholder={t.login_password}
            className="input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
          />

          <button
            type="submit"
            className="w-full btn btn-primary"
            disabled={loading}
          >
            {loading ? t.login_loading : t.login_button}
          </button>
        </form>

        <div className={`mt-3 ${isRTL ? "text-left" : "text-right"}`}>
          <a
            href="/forgot-password"
            className="text-xs opacity-70 hover:underline"
          >
            {t.login_forgot_password}
          </a>
        </div>
      </div>
    </div>
  )
}