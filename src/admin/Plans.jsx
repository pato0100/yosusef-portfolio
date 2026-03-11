import { useEffect, useMemo, useState } from "react"
import {
  createPlan,
  deletePlan,
  getPlans,
  togglePlanField,
  updatePlan,
} from "../services/plans"

const initialForm = {
  code: "",
  name: "",
  description: "",
  monthly_price: 0,
  yearly_price: 0,
  currency: "USD",
  is_active: true,
  is_public: true,
  is_popular: false,
  sort_order: 0,
  limits: {
    max_projects: 3,
    max_gallery_images: 10,
    max_project_images: 10,
    contact_daily_limit: 20,
    contact_monthly_limit: 500,
    storage_limit_mb: 100,
  },
  features: {
    custom_domain: false,
    analytics: false,
    premium_themes: false,
    remove_branding: false,
    download_vcard: true,
    priority_support: false,
    team_accounts: false,
  },
}

const featureItems = [
  ["custom_domain", "Custom Domain"],
  ["analytics", "Analytics"],
  ["premium_themes", "Premium Themes"],
  ["remove_branding", "Remove Branding"],
  ["download_vcard", "Download vCard"],
  ["priority_support", "Priority Support"],
  ["team_accounts", "Team Accounts"],
]

export default function Plans() {
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState(null)

  async function load() {
    try {
      setLoading(true)
      setError("")
      const data = await getPlans()
      setPlans(data)
    } catch (err) {
      setError(err.message || "Failed to load plans")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
    setError("")
  }

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function setLimitField(field, value) {
    setForm((prev) => ({
      ...prev,
      limits: {
        ...prev.limits,
        [field]: Number(value),
      },
    }))
  }

  function setFeatureField(field, value) {
    setForm((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [field]: value,
      },
    }))
  }

  function validateForm() {
    if (!form.code.trim()) return "Plan code is required"
    if (!/^[a-z0-9-_]+$/.test(form.code.trim().toLowerCase())) {
      return "Plan code must contain only lowercase letters, numbers, dash, or underscore"
    }
    if (!form.name.trim()) return "Plan name is required"
    if (Number(form.monthly_price) < 0) return "Monthly price cannot be negative"
    if (Number(form.yearly_price) < 0) return "Yearly price cannot be negative"

    const limitValues = Object.values(form.limits)
    if (limitValues.some((value) => Number(value) < 0)) {
      return "Limits cannot be negative"
    }

    return ""
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError("")

      if (editingId) {
        await updatePlan(editingId, form)
      } else {
        await createPlan(form)
      }

      await load()
      resetForm()
    } catch (err) {
      setError(err.message || "Failed to save plan")
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(plan) {
    setEditingId(plan.id)
    setForm({
      code: plan.code || "",
      name: plan.name || "",
      description: plan.description || "",
      monthly_price: plan.monthly_price || 0,
      yearly_price: plan.yearly_price || 0,
      currency: plan.currency || "USD",
      is_active: Boolean(plan.is_active),
      is_public: Boolean(plan.is_public),
      is_popular: Boolean(plan.is_popular),
      sort_order: plan.sort_order || 0,
      limits: {
        max_projects: plan.limits?.max_projects ?? 0,
        max_gallery_images: plan.limits?.max_gallery_images ?? 0,
        max_project_images: plan.limits?.max_project_images ?? 0,
        contact_daily_limit: plan.limits?.contact_daily_limit ?? 0,
        contact_monthly_limit: plan.limits?.contact_monthly_limit ?? 0,
        storage_limit_mb: plan.limits?.storage_limit_mb ?? 0,
      },
      features: {
        custom_domain: Boolean(plan.features?.custom_domain),
        analytics: Boolean(plan.features?.analytics),
        premium_themes: Boolean(plan.features?.premium_themes),
        remove_branding: Boolean(plan.features?.remove_branding),
        download_vcard: Boolean(plan.features?.download_vcard),
        priority_support: Boolean(plan.features?.priority_support),
        team_accounts: Boolean(plan.features?.team_accounts),
      },
    })
    setError("")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleDelete(id) {
    const confirmed = window.confirm("Are you sure you want to delete this plan?")
    if (!confirmed) return

    try {
      await deletePlan(id)
      await load()

      if (editingId === id) {
        resetForm()
      }
    } catch (err) {
      setError(err.message || "Failed to delete plan")
    }
  }

  async function handleToggle(plan, field) {
    try {
      setError("")
      await togglePlanField(plan.id, field, !plan[field])
      await load()
    } catch (err) {
      setError(err.message || "Failed to update plan flag")
    }
  }

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return plans

    return plans.filter((plan) => {
      return (
        plan.name?.toLowerCase().includes(query) ||
        plan.code?.toLowerCase().includes(query) ||
        plan.description?.toLowerCase().includes(query)
      )
    })
  }, [plans, search])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Plans</h1>
          <p className="mt-1 text-white/60">
            Manage pricing, limits, features, and visibility
          </p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="rounded-xl border border-cyan-400/30 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-400/10"
        >
          New Plan
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5 shadow-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            {editingId ? "Edit Plan" : "Create Plan"}
          </h2>

          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-white/60 hover:text-white"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            value={form.code}
            onChange={(e) => setField("code", e.target.value.toLowerCase())}
            placeholder="Code (free, pro, business)"
            className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
          />

          <input
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Plan name"
            className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
          />

          <input
            value={form.monthly_price}
            onChange={(e) => setField("monthly_price", Number(e.target.value))}
            type="number"
            min="0"
            step="0.01"
            placeholder="Monthly price"
            className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
          />

          <input
            value={form.yearly_price}
            onChange={(e) => setField("yearly_price", Number(e.target.value))}
            type="number"
            min="0"
            step="0.01"
            placeholder="Yearly price"
            className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
          />

          <input
            value={form.currency}
            onChange={(e) => setField("currency", e.target.value.toUpperCase())}
            placeholder="Currency (USD)"
            maxLength={10}
            className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
          />

          <input
            value={form.sort_order}
            onChange={(e) => setField("sort_order", Number(e.target.value))}
            type="number"
            min="0"
            placeholder="Sort order"
            className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
          />

          <div className="md:col-span-2">
            <input
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Description"
              className="w-full rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Limits</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <input
              value={form.limits.max_projects}
              onChange={(e) => setLimitField("max_projects", e.target.value)}
              type="number"
              min="0"
              placeholder="Max projects"
              className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
            />

            <input
              value={form.limits.max_gallery_images}
              onChange={(e) => setLimitField("max_gallery_images", e.target.value)}
              type="number"
              min="0"
              placeholder="Max gallery images"
              className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
            />

            <input
              value={form.limits.max_project_images}
              onChange={(e) => setLimitField("max_project_images", e.target.value)}
              type="number"
              min="0"
              placeholder="Max project images"
              className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
            />

            <input
              value={form.limits.contact_daily_limit}
              onChange={(e) => setLimitField("contact_daily_limit", e.target.value)}
              type="number"
              min="0"
              placeholder="Contact daily limit"
              className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
            />

            <input
              value={form.limits.contact_monthly_limit}
              onChange={(e) => setLimitField("contact_monthly_limit", e.target.value)}
              type="number"
              min="0"
              placeholder="Contact monthly limit"
              className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
            />

            <input
              value={form.limits.storage_limit_mb}
              onChange={(e) => setLimitField("storage_limit_mb", e.target.value)}
              type="number"
              min="0"
              placeholder="Storage limit MB"
              className="rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
            />
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Features</h3>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featureItems.map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-slate-800 px-4 py-3 text-white"
              >
                <input
                  type="checkbox"
                  checked={form.features[key]}
                  onChange={(e) => setFeatureField(key, e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-3 text-lg font-semibold text-white">Visibility</h3>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              ["is_active", "Active"],
              ["is_public", "Public"],
              ["is_popular", "Popular"],
            ].map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-3 rounded-xl border border-cyan-400/20 bg-slate-800 px-4 py-3 text-white"
              >
                <input
                  type="checkbox"
                  checked={form[key]}
                  onChange={(e) => setField(key, e.target.checked)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : editingId ? "Update Plan" : "Create Plan"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            className="rounded-xl border border-white/15 px-5 py-3 text-white/70 hover:bg-white/5"
          >
            Reset
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5 shadow-lg">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-white">Plans List</h2>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, name, or description"
            className="w-full max-w-md rounded-xl border border-cyan-400/30 bg-slate-800 px-4 py-3 text-white outline-none"
          />
        </div>

        {loading ? (
          <div className="text-white/60">Loading plans...</div>
        ) : filteredPlans.length === 0 ? (
          <div className="text-white/60">No plans found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm text-white">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/70">
                  <th className="px-3 py-3">Code</th>
                  <th className="px-3 py-3">Name</th>
                  <th className="px-3 py-3">Monthly</th>
                  <th className="px-3 py-3">Yearly</th>
                  <th className="px-3 py-3">Projects</th>
                  <th className="px-3 py-3">Gallery</th>
                  <th className="px-3 py-3">Project Images</th>
                  <th className="px-3 py-3">Daily Contacts</th>
                  <th className="px-3 py-3">Monthly Contacts</th>
                  <th className="px-3 py-3">Storage</th>
                  <th className="px-3 py-3">Flags</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredPlans.map((plan) => (
                  <tr key={plan.id} className="border-b border-white/5 align-top">
                    <td className="px-3 py-4 font-medium">{plan.code}</td>
                    <td className="px-3 py-4">
                      <div className="font-medium">{plan.name}</div>
                      <div className="mt-1 max-w-xs text-xs text-white/50">
                        {plan.description || "No description"}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      {plan.monthly_price} {plan.currency}
                    </td>
                    <td className="px-3 py-4">
                      {plan.yearly_price} {plan.currency}
                    </td>
                    <td className="px-3 py-4">{plan.limits?.max_projects ?? "-"}</td>
                    <td className="px-3 py-4">{plan.limits?.max_gallery_images ?? "-"}</td>
                    <td className="px-3 py-4">{plan.limits?.max_project_images ?? "-"}</td>
                    <td className="px-3 py-4">{plan.limits?.contact_daily_limit ?? "-"}</td>
                    <td className="px-3 py-4">{plan.limits?.contact_monthly_limit ?? "-"}</td>
                    <td className="px-3 py-4">
                      {plan.limits?.storage_limit_mb ?? "-"} MB
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-lg px-2 py-1 text-xs ${
                            plan.is_active
                              ? "bg-green-500/20 text-green-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {plan.is_active ? "Active" : "Inactive"}
                        </span>

                        <span
                          className={`rounded-lg px-2 py-1 text-xs ${
                            plan.is_public
                              ? "bg-cyan-500/20 text-cyan-300"
                              : "bg-gray-500/20 text-gray-300"
                          }`}
                        >
                          {plan.is_public ? "Public" : "Private"}
                        </span>

                        {plan.is_popular ? (
                          <span className="rounded-lg bg-yellow-500/20 px-2 py-1 text-xs text-yellow-300">
                            Popular
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleEdit(plan)}
                          className="rounded-lg bg-blue-500 px-3 py-2 text-white"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleToggle(plan, "is_active")}
                          className="rounded-lg bg-amber-500 px-3 py-2 text-black"
                        >
                          {plan.is_active ? "Deactivate" : "Activate"}
                        </button>

                        <button
                          onClick={() => handleToggle(plan, "is_public")}
                          className="rounded-lg bg-indigo-500 px-3 py-2 text-white"
                        >
                          {plan.is_public ? "Make Private" : "Make Public"}
                        </button>

                        <button
                          onClick={() => handleToggle(plan, "is_popular")}
                          className="rounded-lg bg-fuchsia-500 px-3 py-2 text-white"
                        >
                          {plan.is_popular ? "Unpopular" : "Popular"}
                        </button>

                        <button
                          onClick={() => handleDelete(plan.id)}
                          className="rounded-lg bg-red-500 px-3 py-2 text-white"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
