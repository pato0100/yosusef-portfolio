import { Navigate } from "react-router-dom"

export default function RootRedirect() {
  const defaultUser = import.meta.env.VITE_DEFAULT_USERNAME

  console.log(import.meta.env.VITE_DEFAULT_USERNAME)

  return <Navigate to={`/${defaultUser}`} replace />
}
