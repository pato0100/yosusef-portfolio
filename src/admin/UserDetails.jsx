import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { getPlans } from "../services/plans"
import {
  getUserDetails,
  banUser,
  unbanUser,
  deleteUser,
} from "../services/adminUsers"

import {
  extendUserSubscription,
  assignPlanToUser,
  cancelUserSubscription,
} from "../services/subscriptions"

export default function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [subscriptionForm, setSubscriptionForm] = useState({
    plan_id: "",
    status: "active",
    end_date: "",
    is_lifetime: false,
    notes: "",
  })

  async function load() {
    try {
      setLoading(true)
      setError("")
      setSuccess("")

      const [userData, plansData] = await Promise.all([
        getUserDetails(id),
        getPlans(),
      ])

      setUser(userData)
      setPlans(plansData || [])

      const activeSubscription =
        userData?.subscriptions?.find((sub) => sub.status === "active") ||
        userData?.subscriptions?.[0] ||
        null

      setSubscriptionForm({
        plan_id: activeSubscription?.plan_id || "",
        status: activeSubscription?.status || "active",
        end_date: activeSubscription?.end_date
          ? new Date(activeSubscription.end_date).toISOString().slice(0, 10)
          : "",
        is_lifetime: Boolean(activeSubscription?.is_lifetime),
        notes: activeSubscription?.notes || "",
      })
    } catch (err) {
      setError(err.message || "Failed to load user details")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const activeSubscription = useMemo(() => {
    if (!user?.subscriptions?.length) return null

    return (
      user.subscriptions.find((sub) => sub.status === "active") ||
      user.subscriptions[0]
    )
  }, [user])

  const currentPlanName =
    activeSubscription?.plans?.name ||
    plans.find((p) => p.id === subscriptionForm.plan_id)?.name ||
    "Free"

  async function runAction(action, successMessage) {
    try {
      setActionLoading(true)
      setError("")
      setSuccess("")

      await action()
      await load()

      if (successMessage) {
        setSuccess(successMessage)
      }
    } catch (err) {
      setError(err.message || "Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleBan() {
    await runAction(() => banUser(user.id), "User banned successfully")
  }

  async function handleUnban() {
    await runAction(() => unbanUser(user.id), "User unbanned successfully")
  }

  async function handleDelete() {
    const confirmed = window.confirm("Delete this user?")
    if (!confirmed) return

    try {
      setActionLoading(true)
      setError("")
      setSuccess("")

      await deleteUser(user.id)
      navigate("/admin/users")
    } catch (err) {
      setError(err.message || "Failed to delete user")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleExtend() {
    await runAction(
      () => extendUserSubscription(user.id),
      "Subscription extended by 1 month"
    )
  }

  async function handleCancelSubscription() {
    await runAction(
      () => cancelUserSubscription(user.id),
      "Subscription canceled successfully"
    )
  }

  async function handleAssignPlan(e) {
    e.preventDefault()

    if (!subscriptionForm.plan_id) {
      setError("Please select a plan")
      return
    }

    if (
      !subscriptionForm.is_lifetime &&
      ["active", "trialing", "past_due"].includes(subscriptionForm.status) &&
      !subscriptionForm.end_date
    ) {
      setError("Please select an end date or mark it as lifetime")
      return
    }

    await runAction(
      () =>
        assignPlanToUser(user.id, {
          plan_id: subscriptionForm.plan_id,
          status: subscriptionForm.status,
          end_date: subscriptionForm.is_lifetime
            ? null
            : subscriptionForm.end_date || null,
          is_lifetime: subscriptionForm.is_lifetime,
          notes: subscriptionForm.notes,
        }),
      "Plan updated successfully"
    )
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  if (!user) {
    return <div className="text-red-300">User not found.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Details</h1>
        <p className="mt-1 text-white/60">
          Manage user profile, subscription, and account status
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {success}
        </div>
      ) : null}

      <div className="card space-y-2 p-4">
        <h2 className="font-bold text-white">User Info</h2>
        <div className="text-white/80">Email: {user.email}</div>
        <div className="text-white/80">Slug: {user.slug}</div>
        <div className="text-white/80">
          Status: {user.banned ? "Banned" : "Active"}
        </div>
        <div className="text-white/80">
          Joined: {new Date(user.created_at).toLocaleDateString()}
        </div>
      </div>

      <div className="card space-y-2 p-4">
        <h2 className="font-bold text-white">Current Subscription</h2>
        <div className="text-white/80">Plan: {currentPlanName}</div>
        <div className="text-white/80">
          Status: {activeSubscription?.status || "No subscription"}
        </div>
        <div className="text-white/80">
          Lifetime: {activeSubscription?.is_lifetime ? "Yes" : "No"}
        </div>
        <div className="text-white/80">
          End Date:{" "}
          {activeSubscription?.end_date
            ? new Date(activeSubscription.end_date).toLocaleDateString()
            : activeSubscription?.is_lifetime
              ? "Lifetime"
              : "No subscription"}
        </div>
        <div className="text-white/80">
          Source: {activeSubscription?.source || "Unknown"}
        </div>
        <div className="text-white/80">
          Invite: {activeSubscription?.invites?.code || "No invite"}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleExtend}
            disabled={
              actionLoading || !activeSubscription || activeSubscription?.is_lifetime
            }
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
          >
            Extend 1 Month
          </button>

          <button
            onClick={handleCancelSubscription}
            disabled={actionLoading || !activeSubscription}
            className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-50"
          >
            Cancel Subscription
          </button>
        </div>
      </div>

      <form onSubmit={handleAssignPlan} className="card space-y-4 p-4">
        <h2 className="font-bold text-white">Assign / Change Plan</h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <select
            value={subscriptionForm.plan_id}
            onChange={(e) =>
              setSubscriptionForm((prev) => ({
                ...prev,
                plan_id: e.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
          >
            <option value="">Select plan</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.code})
              </option>
            ))}
          </select>

          <select
            value={subscriptionForm.status}
            onChange={(e) =>
              setSubscriptionForm((prev) => ({
                ...prev,
                status: e.target.value,
              }))
            }
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
          >
            <option value="active">active</option>
            <option value="trialing">trialing</option>
            <option value="canceled">canceled</option>
            <option value="expired">expired</option>
            <option value="past_due">past_due</option>
          </select>

          <input
            type="date"
            value={subscriptionForm.end_date}
            onChange={(e) =>
              setSubscriptionForm((prev) => ({
                ...prev,
                end_date: e.target.value,
              }))
            }
            disabled={subscriptionForm.is_lifetime}
            className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white disabled:opacity-50"
          />

          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={subscriptionForm.is_lifetime}
              onChange={(e) =>
                setSubscriptionForm((prev) => ({
                  ...prev,
                  is_lifetime: e.target.checked,
                }))
              }
            />
            Lifetime subscription
          </label>
        </div>

        <textarea
          value={subscriptionForm.notes}
          onChange={(e) =>
            setSubscriptionForm((prev) => ({
              ...prev,
              notes: e.target.value,
            }))
          }
          placeholder="Admin notes"
          className="min-h-[100px] w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
        />

        <button
          type="submit"
          disabled={actionLoading}
          className="rounded bg-cyan-500 px-4 py-2 font-semibold text-black disabled:opacity-50"
        >
          {actionLoading ? "Saving..." : "Save Subscription"}
        </button>
      </form>

      <div className="card space-y-2 p-4">
        <h2 className="font-bold text-white">Usage</h2>
        <div className="text-white/80">Projects: {user.projects_count || 0}</div>
        <div className="text-white/80">
          Storage: {user.storage_used_mb || 0} MB
        </div>
      </div>

      <div className="card space-y-2 p-4">
        <h2 className="font-bold text-white">Projects</h2>

        {user.projects?.length === 0 ? (
          <div className="text-white/60">No projects</div>
        ) : (
          <ul className="space-y-1">
            {user.projects?.map((project) => (
              <li key={project.id} className="text-white/80">
                {project.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="font-bold text-white">Subscription History</h2>

        {!user.subscriptions?.length ? (
          <div className="text-white/60">No subscription history</div>
        ) : (
          <div className="space-y-3">
            {user.subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="rounded-lg border border-white/10 p-3 text-sm text-white/80"
              >
                <div>Plan: {sub.plans?.name || "Unknown"}</div>
                <div>Status: {sub.status || "-"}</div>
                <div>
                  Start:{" "}
                  {sub.start_date
                    ? new Date(sub.start_date).toLocaleDateString()
                    : "-"}
                </div>
                <div>
                  End:{" "}
                  {sub.end_date
                    ? new Date(sub.end_date).toLocaleDateString()
                    : sub.is_lifetime
                      ? "Lifetime"
                      : "-"}
                </div>
                <div>Source: {sub.source || "-"}</div>
                <div>Invite: {sub.invites?.code || "-"}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {user.banned ? (
          <button
            onClick={handleUnban}
            disabled={actionLoading}
            className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50"
          >
            Unban
          </button>
        ) : (
          <button
            onClick={handleBan}
            disabled={actionLoading}
            className="rounded bg-yellow-600 px-3 py-2 text-white disabled:opacity-50"
          >
            Ban
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={actionLoading}
          className="rounded bg-red-600 px-3 py-2 text-white disabled:opacity-50"
        >
          Delete User
        </button>
      </div>
    </div>
  )
}
