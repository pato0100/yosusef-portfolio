import { supabase } from "../lib/supabase"

// Get users with pagination + search
export async function getUsers(page = 1, search = "") {
  const limit = 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from("profiles")
    .select("id,email,slug,is_admin,banned,created_at", { count: "exact" })
    .range(from, to)
    .order("created_at", { ascending: false })

  if (search) {
    query = query.ilike("email", `%${search}%`)
  }

  const { data, count, error } = await query

  if (error) throw error

  return {
    users: data || [],
    total: count || 0,
  }
}

export async function deleteUser(id) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function banUser(id) {
  const { error } = await supabase
    .from("profiles")
    .update({ banned: true })
    .eq("id", id)

  if (error) throw error
}

export async function unbanUser(id) {
  const { error } = await supabase
    .from("profiles")
    .update({ banned: false })
    .eq("id", id)

  if (error) throw error
}

export async function getUserDetails(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      slug,
      banned,
      projects_count,
      storage_used_mb,
      created_at,
      subscriptions!subscriptions_user_id_fkey (
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
      ),
      projects (
        id,
        title,
        created_at
      )
    `)
    .eq("id", userId)
    .single()

  if (error) throw error

  if (data?.subscriptions?.length) {
    data.subscriptions = [...data.subscriptions].sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1
      if (a.status !== "active" && b.status === "active") return 1

      const aDate = a.created_at ? new Date(a.created_at).getTime() : 0
      const bDate = b.created_at ? new Date(b.created_at).getTime() : 0

      return bDate - aDate
    })
  }

  return data
}
