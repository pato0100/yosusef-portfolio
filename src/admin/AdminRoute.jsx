import { useEffect, useState } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { supabase } from "../lib/supabase"

export default function AdminRoute({ children }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    let mounted = true

    async function checkAdmin() {
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          if (mounted) {
            setIsAllowed(false)
            setLoading(false)
          }
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, is_admin, banned, deleted")
          .eq("id", user.id)
          .maybeSingle()

        if (profileError || !profile) {
          if (mounted) {
            setIsAllowed(false)
            setLoading(false)
          }
          return
        }

        const allowed =
          profile.is_admin === true &&
          profile.banned !== true &&
          profile.deleted !== true

        if (mounted) {
          setIsAllowed(allowed)
          setLoading(false)
        }
      } catch {
        if (mounted) {
          setIsAllowed(false)
          setLoading(false)
        }
      }
    }

    checkAdmin()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  if (!isAllowed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}