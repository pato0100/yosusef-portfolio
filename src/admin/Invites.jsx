import { useEffect, useState } from "react"
import { createInvite, getInvites } from "../services/invites"

export default function Invites() {
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  async function load() {
    try {
      setLoading(true)
      setError("")
      const data = await getInvites()
      setInvites(data)
    } catch (err) {
      setError(err.message || "Failed to load invites")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate() {
    try {
      setCreating(true)
      setError("")

      await createInvite(null)
      await load()

      alert("Invite created successfully")
    } catch (err) {
      setError(err.message || "Failed to create invite")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 text-white">Invites</h1>
        <p className="text-white/60">
          Create and manage signup invitation links
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="btn btn-primary mb-2 disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create Invite"}
      </button>

      {loading ? (
        <div className="text-white/60">Loading invites...</div>
      ) : invites.length === 0 ? (
        <div className="text-white/60">No invites found.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Plan</th>
              <th className="p-2 text-left">Uses</th>
              <th className="p-2 text-left">Link</th>
            </tr>
          </thead>

          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id} className="border-b border-white/5">
                <td className="p-2">{invite.code}</td>

                <td className="p-2">
                  {invite.plan?.name || "No plan"}
                </td>

                <td className="p-2">
                  {invite.used_count}/{invite.max_uses}
                </td>

                <td className="p-2">
                  <a
                    href={`/signup?invite=${invite.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 hover:underline"
                  >
                    /signup?invite={invite.code}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
