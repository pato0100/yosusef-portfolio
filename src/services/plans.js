import { supabase } from "../lib/supabase"

function normalizePlanPayload(values) {
  return {
    code: values.code?.trim().toLowerCase() || "",
    name: values.name?.trim() || "",
    description: values.description?.trim() || "",
    monthly_price: Number(values.monthly_price || 0),
    yearly_price: Number(values.yearly_price || 0),
    currency: values.currency?.trim().toUpperCase() || "USD",
    is_active: Boolean(values.is_active),
    is_public: Boolean(values.is_public),
    is_popular: Boolean(values.is_popular),
    sort_order: Number(values.sort_order || 0),
    limits: {
      max_projects: Number(values.limits?.max_projects || 0),
      max_gallery_images: Number(values.limits?.max_gallery_images || 0),
      max_project_images: Number(values.limits?.max_project_images || 0),
      contact_daily_limit: Number(values.limits?.contact_daily_limit || 0),
      contact_monthly_limit: Number(values.limits?.contact_monthly_limit || 0),
      storage_limit_mb: Number(values.limits?.storage_limit_mb || 0),
    },
    features: {
      custom_domain: Boolean(values.features?.custom_domain),
      analytics: Boolean(values.features?.analytics),
      premium_themes: Boolean(values.features?.premium_themes),
      remove_branding: Boolean(values.features?.remove_branding),
      download_vcard: Boolean(values.features?.download_vcard),
      priority_support: Boolean(values.features?.priority_support),
      team_accounts: Boolean(values.features?.team_accounts),
    },
  }
}

export async function getPlans() {
  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("monthly_price", { ascending: true })

  if (error) throw error
  return data || []
}

export async function createPlan(values) {
  const payload = normalizePlanPayload(values)

  const { data, error } = await supabase
    .from("plans")
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlan(id, values) {
  const payload = normalizePlanPayload(values)

  const { data, error } = await supabase
    .from("plans")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePlan(id) {
  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function togglePlanField(id, field, value) {
  const { data, error } = await supabase
    .from("plans")
    .update({ [field]: value })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}
