import { supabase } from "../lib/supabase"

function generateCode() {
  return crypto.randomUUID().slice(0, 8)
}

export async function createInvite(planId) {
  const code = generateCode()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) throw userError
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("invites")
    .insert({
      code,
      plan_id: planId || null,
      max_uses: 1,
      used_count: 0,
      created_by: user.id,
    })
    .select("*")
    .single()

  if (error) throw error

  return data
}

export async function getInvites() {
  const [{ data: invites, error: invitesError }, { data: plans, error: plansError }] =
    await Promise.all([
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
