import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ children }) {

  const [session,setSession] = useState(undefined)

  useEffect(()=>{

    async function load(){

      const { data } = await supabase.auth.getSession()

      setSession(data.session)

    }

    load()

  },[])

  if(session === undefined){

    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )

  }

  if(!session){

    return <Navigate to="/login" replace />

  }

  return children
}