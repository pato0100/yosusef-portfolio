import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-admin-secret, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

// Temporary in-memory rate limit
const ipRequests = new Map<string, number>()

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }

  return req.headers.get("cf-connecting-ip")?.trim() || "unknown"
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function normalizeUsername(value: unknown): string {
  return normalizeText(value, 50).toLowerCase().replace(/[^a-z0-9_]/g, "")
}

function normalizeSlug(value: unknown): string {
  return normalizeText(value, 80).toLowerCase().replace(/[^a-z0-9-]/g, "")
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405)
  }

  try {
    const ip = getClientIp(req)

    // Simple rate limit: one request every 5 seconds per IP
    const now = Date.now()
    const last = ipRequests.get(ip)

    if (last && now - last < 5000) {
      return jsonResponse({ error: "TOO_MANY_REQUESTS" }, 429)
    }

    ipRequests.set(ip, now)

    const adminSecret = req.headers.get("x-admin-secret")

    if (!adminSecret || adminSecret !== Deno.env.get("ADMIN_SECRET")) {
      return jsonResponse({ error: "UNAUTHORIZED" }, 401)
    }

    const body = await req.json()

    const firstName = normalizeText(body.firstName, 50)
    const lastName = normalizeText(body.lastName, 50)
    const email = normalizeText(body.email, 200).toLowerCase()
    const password = typeof body.password === "string" ? body.password : ""
    const inviteCode = normalizeText(body.inviteCode, 100)
    const username = normalizeUsername(body.username)
    const userSlug = normalizeSlug(body.slug)

    if (!username) {
      return jsonResponse({ error: "USERNAME_REQUIRED" }, 400)
    }

    if (!email || !password || !inviteCode) {
      return jsonResponse({ error: "MISSING_REQUIRED_FIELDS" }, 400)
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: "INVALID_EMAIL" }, 400)
    }

    if (password.length < 6) {
      return jsonResponse({ error: "PASSWORD_TOO_SHORT" }, 400)
    }

    const slug = normalizeSlug(userSlug || username)

    if (!slug) {
      return jsonResponse({ error: "INVALID_SLUG" }, 400)
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    // Validate invite
    const { data: invite, error: inviteError } = await supabase
      .from("invites")
      .select("*")
      .eq("code", inviteCode)
      .single()

    if (inviteError || !invite) {
      return jsonResponse({ error: "INVALID_INVITE" }, 400)
    }

    const nowDate = new Date()

    if (invite.expires_at && new Date(invite.expires_at) < nowDate) {
      return jsonResponse({ error: "INVITE_EXPIRED" }, 400)
    }

    if (invite.max_uses && invite.used_count >= invite.max_uses) {
      return jsonResponse({ error: "INVITE_ALREADY_USED" }, 400)
    }

    // Check slug uniqueness
    const { data: existingSlug, error: existingSlugError } = await supabase
      .from("profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existingSlugError) {
      console.error("Slug check error:", existingSlugError)
      return jsonResponse({ error: "FAILED_TO_VALIDATE_SLUG" }, 500)
    }

    if (existingSlug) {
      return jsonResponse({ error: "SLUG_ALREADY_TAKEN" }, 400)
    }

    // Check username uniqueness
    const { data: existingUsername, error: existingUsernameError } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle()

    if (existingUsernameError) {
      console.error("Username check error:", existingUsernameError)
      return jsonResponse({ error: "FAILED_TO_VALIDATE_USERNAME" }, 500)
    }

    if (existingUsername) {
      return jsonResponse({ error: "USERNAME_ALREADY_TAKEN" }, 400)
    }

    // Create user
    const { data: user, error: userError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
      })

    if (userError || !user?.user) {
      console.error("Create user error:", userError)
      return jsonResponse(
        {
          error: "FAILED_TO_CREATE_USER",
          details: userError?.message || null,
        },
        400
      )
    }

    const fullName = `${firstName || ""} ${lastName || ""}`.trim()

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.user.id,
        email,
        slug,
        username,
        name_en: fullName,
      })

    if (profileError) {
      console.error("Profile insert error:", profileError)
      return jsonResponse({ error: "FAILED_TO_CREATE_PROFILE" }, 500)
    }

    // Create settings
    const { error: settingsError } = await supabase
      .from("settings")
      .insert({
        owner_id: user.user.id,
        default_lang: "en",
        default_theme: "dark",
      })

    if (settingsError) {
      console.error("Settings insert error:", settingsError)
      return jsonResponse({ error: "FAILED_TO_CREATE_SETTINGS" }, 500)
    }

    // Create subscription if invite has plan
    if (invite.plan_id) {
      const { error: subscriptionError } = await supabase
        .from("subscriptions")
        .insert({
          user_id: user.user.id,
          plan_id: invite.plan_id,
          status: "active",
          start_date: new Date().toISOString(),
        })

      if (subscriptionError) {
        console.error("Subscription insert error:", subscriptionError)
        return jsonResponse({ error: "FAILED_TO_CREATE_SUBSCRIPTION" }, 500)
      }
    }

    // Update invite usage
    const { error: inviteUpdateError } = await supabase
      .from("invites")
      .update({
        used_count: invite.used_count + 1,
      })
      .eq("id", invite.id)

    if (inviteUpdateError) {
      console.error("Invite update error:", inviteUpdateError)
      return jsonResponse({ error: "FAILED_TO_UPDATE_INVITE_USAGE" }, 500)
    }

    return jsonResponse({
      success: true,
      slug,
    })
  } catch (e) {
    console.error("admin-create-user error:", e)
    return jsonResponse({ error: "SERVER_ERROR" }, 500)
  }
})