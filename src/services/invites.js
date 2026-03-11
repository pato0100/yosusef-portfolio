import { supabase } from "../lib/supabase"

function generateCode() {
  return crypto.randomUUID().slice(0, 8).toLowerCase()
}

export async function createInvite(planId, options = {}) {
  const {
    maxUses = 1,
    expiresAt = null,
  } = options

  const normalizedMaxUses = Number(maxUses)

  if (!Number.isInteger(normalizedMaxUses) || normalizedMaxUses <= 0) {
    throw new Error("INVALID_MAX_USES")
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("User not authenticated")

  const code = generateCode()

  const { data, error } = await supabase
    .from("invites")
    .insert({
      code,
      plan_id: planId || null,
      max_uses: normalizedMaxUses,
      used_count: 0,
      expires_at: expiresAt,
      created_by: user.id,
    })
    .select("*")
    .single()

  if (error) throw error

  return data
}

export async function getInvites() {
  const [
    { data: invites, error: invitesError },
    { data: plans, error: plansError },
  ] = await Promise.all([
    supabase
      .from("invites")
      .select(`
        id,
        code,
        plan_id,
        used_count,
        max_uses,
        expires_at,
        created_at
      `)
      .order("created_at", { ascending: false }),

    supabase
      .from("plans")
      .select("id, code, name"),
  ])

  if (invitesError) throw invitesError
  if (plansError) throw plansError

  const plansMap = new Map((plans || []).map((plan) => [plan.id, plan]))

  return (invites || []).map((invite) => ({
    ...invite,
    plan: invite.plan_id ? plansMap.get(invite.plan_id) || null : null,
  }))
}

export async function validateInvite(code) {
  if (!code?.trim()) {
    throw new Error("INVALID_INVITE")
  }

  const trimmedCode = code.trim().toLowerCase()

  const { data, error } = await supabase
    .from("invites")
    .select(`
      id,
      code,
      plan_id,
      used_count,
      max_uses,
      expires_at,
      created_at
    `)
    .eq("code", trimmedCode)
    .maybeSingle()

  if (error) throw error

  if (!data) {
    throw new Error("INVALID_INVITE")
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    throw new Error("INVITE_EXPIRED")
  }

  if (
    typeof data.max_uses === "number" &&
    typeof data.used_count === "number" &&
    data.used_count >= data.max_uses
  ) {
    throw new Error("INVITE_ALREADY_USED")
  }

  let plan = null

  if (data.plan_id) {
    const { data: planData, error: planError } = await supabase
      .from("plans")
      .select(`
        id,
        code,
        name,
        description,
        monthly_price,
        yearly_price,
        currency,
        is_active,
        is_public,
        is_popular,
        sort_order,
        limits,
        features
      `)
      .eq("id", data.plan_id)
      .maybeSingle()

    if (planError) throw planError

    if (!planData) {
      throw new Error("INVALID_INVITE")
    }

    if (!planData.is_active) {
      throw new Error("INVALID_INVITE")
    }

    plan = planData
  }

  return {
    ...data,
    plan,
  }
}
