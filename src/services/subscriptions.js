import { supabase } from "../lib/supabase"

function sortSubscriptions(subscriptions = []) {
  return [...subscriptions].sort((a, b) => {
    if (a.status === "active" && b.status !== "active") return -1
    if (a.status !== "active" && b.status === "active") return 1

    const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
    const bDate = b.created_at ? new Date(b.created_at).getTime() : 0

    return bDate - aDate
  })
}

function addMonthsToDate(dateInput, months = 1) {
  const date = dateInput ? new Date(dateInput) : new Date()

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date")
  }

  date.setMonth(date.getMonth() + months)
  return date.toISOString()
}

async function getSubscriptionsRaw(userId) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      user_id,
      plan_id,
      status,
      start_date,
      end_date,
      is_lifetime,
      source,
      notes,
      invite_id,
      created_at,
      plans (
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
      ),
      invites (
        id,
        code
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error

  return sortSubscriptions(data || [])
}

export async function getUserSubscriptions(userId) {
  return await getSubscriptionsRaw(userId)
}

export async function getUserActiveSubscription(userId) {
  const subscriptions = await getSubscriptionsRaw(userId)

  return (
    subscriptions.find((sub) => sub.status === "active") ||
    subscriptions[0] ||
    null
  )
}

export async function getCurrentPlanForUser(userId) {
  const subscription = await getUserActiveSubscription(userId)

  if (!subscription) {
    return {
      subscription: null,
      plan: null,
      limits: {},
      features: {},
    }
  }

  return {
    subscription,
    plan: subscription.plans || null,
    limits: subscription.plans?.limits || {},
    features: subscription.plans?.features || {},
  }
}

export async function assignPlanToUser(userId, values) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  if (!values?.plan_id) {
    throw new Error("Plan ID is required")
  }

  const status = values.status || "active"
  const isLifetime = Boolean(values.is_lifetime)
  const endDate = isLifetime ? null : values.end_date || null
  const notes = values.notes?.trim() || null
  const inviteId = values.invite_id || null
  const source = values.source || "admin"
  const nowIso = new Date().toISOString()

  const { data: currentSubscriptions, error: currentError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")

  if (currentError) throw currentError

  if (currentSubscriptions?.length) {
    const activeIds = currentSubscriptions.map((sub) => sub.id)

    const { error: closeError } = await supabase
      .from("subscriptions")
      .update({ status: "canceled" })
      .in("id", activeIds)

    if (closeError) throw closeError
  }

  const payload = {
    user_id: userId,
    plan_id: values.plan_id,
    status,
    start_date: nowIso,
    end_date: endDate,
    is_lifetime: isLifetime,
    source,
    notes,
    invite_id: inviteId,
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .insert(payload)
    .select(`
      id,
      user_id,
      plan_id,
      status,
      start_date,
      end_date,
      is_lifetime,
      source,
      notes,
      invite_id,
      created_at
    `)
    .single()

  if (error) throw error

  return data
}

export async function extendUserSubscription(userId, months = 1) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  if (months <= 0) {
    throw new Error("Months must be greater than zero")
  }

  const subscription = await getUserActiveSubscription(userId)

  if (!subscription) {
    throw new Error("No subscription found for this user")
  }

  if (subscription.is_lifetime) {
    throw new Error("Cannot extend a lifetime subscription")
  }

  const nextEndDate = addMonthsToDate(subscription.end_date, months)

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      end_date: nextEndDate,
    })
    .eq("id", subscription.id)
    .select(`
      id,
      user_id,
      plan_id,
      status,
      start_date,
      end_date,
      is_lifetime,
      source,
      notes,
      invite_id,
      created_at
    `)
    .single()

  if (error) throw error

  return data
}

export async function cancelUserSubscription(userId) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  const subscription = await getUserActiveSubscription(userId)

  if (!subscription) {
    throw new Error("No active subscription found")
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
    })
    .eq("id", subscription.id)
    .select(`
      id,
      user_id,
      plan_id,
      status,
      start_date,
      end_date,
      is_lifetime,
      source,
      notes,
      invite_id,
      created_at
    `)
    .single()

  if (error) throw error

  return data
}

export async function createSubscriptionFromInvite(userId, invite) {
  if (!userId) {
    throw new Error("User ID is required")
  }

  if (!invite?.plan_id) {
    throw new Error("Invite does not have a plan")
  }

  return await assignPlanToUser(userId, {
    plan_id: invite.plan_id,
    status: "active",
    end_date: null,
    is_lifetime: false,
    source: "invite",
    invite_id: invite.id,
    notes: `Assigned from invite ${invite.code}`,
  })
}
