import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  })
}

function getClientIp(req: Request): string | null {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null
  }

  const cfIp = req.headers.get("cf-connecting-ip")
  if (cfIp) {
    return cfIp.trim()
  }

  return null
}

function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent")?.trim() || null
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function normalizeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return ""
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength)
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

async function verifyTurnstileToken(token: string, ip?: string | null) {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")

  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY is not configured")
  }

  const formData = new FormData()
  formData.append("secret", secret)
  formData.append("response", token)

  if (ip) {
    formData.append("remoteip", ip)
  }

  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    }
  )

  return await response.json()
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405)
  }

  try {
    const body = await req.json()

    const slug = normalizeText(body.slug, 120)
    const name = normalizeText(body.name, 120)
    const email = normalizeText(body.email, 200).toLowerCase()
    const subject = normalizeText(body.subject, 200)
    const message =
      typeof body.message === "string" ? body.message.trim().slice(0, 5000) : ""
    const turnstileToken = normalizeText(body.turnstileToken, 4000)

    if (!slug || !name || !email || !message) {
      return jsonResponse({ error: "MISSING_REQUIRED_FIELDS" }, 400)
    }

    if (!isValidEmail(email)) {
      return jsonResponse({ error: "INVALID_EMAIL" }, 400)
    }

    if (!turnstileToken) {
      return jsonResponse({ error: "MISSING_SECURITY_TOKEN" }, 400)
    }

    const ip = getClientIp(req)
    const userAgent = getUserAgent(req)

    const turnstileResult = await verifyTurnstileToken(turnstileToken, ip)

    if (!turnstileResult?.success) {
      return jsonResponse(
        {
          error: "SECURITY_VERIFICATION_FAILED",
          details: turnstileResult?.["error-codes"] ?? [],
        },
        403
      )
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("slug", slug)
      .single()

    if (profileError || !profile) {
      return jsonResponse({ error: "PROFILE_NOT_FOUND" }, 404)
    }

    if (!profile.email) {
      return jsonResponse({ error: "PROFILE_EMAIL_MISSING" }, 400)
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    let recentCount = 0

    if (ip) {
      const { count, error: rateLimitError } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", profile.id)
        .eq("ip", ip)
        .gte("created_at", tenMinutesAgo)

      if (rateLimitError) {
        console.error("IP rate limit check failed:", rateLimitError)
        return jsonResponse({ error: "RATE_LIMIT_CHECK_FAILED" }, 500)
      }

      recentCount = count ?? 0
    } else {
      const { count, error: rateLimitError } = await supabase
        .from("contact_messages")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", profile.id)
        .eq("email", email)
        .gte("created_at", tenMinutesAgo)

      if (rateLimitError) {
        console.error("Email rate limit check failed:", rateLimitError)
        return jsonResponse({ error: "RATE_LIMIT_CHECK_FAILED" }, 500)
      }

      recentCount = count ?? 0
    }

    if (recentCount >= 3) {
      return jsonResponse({ error: "RATE_LIMIT_EXCEEDED" }, 429)
    }

    const { error: insertError } = await supabase
      .from("contact_messages")
      .insert({
        owner_id: profile.id,
        name,
        email,
        subject,
        message,
        ip,
        user_agent: userAgent,
      })

    if (insertError) {
      console.error("Insert error:", insertError)
      return jsonResponse({ error: "FAILED_TO_SAVE_MESSAGE" }, 500)
    }

    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safeSubject = escapeHtml(subject || "New Contact Message")
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br />")

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Shofni <noreply@shofni.online>",
        to: [profile.email],
        subject: subject || "New Contact Message",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>New Contact Message</h2>
            <p><strong>Name:</strong> ${safeName}</p>
            <p><strong>Email:</strong> ${safeEmail}</p>
            <p><strong>Subject:</strong> ${safeSubject}</p>
            <p><strong>IP:</strong> ${escapeHtml(ip || "Unknown")}</p>
            <hr />
            <p>${safeMessage}</p>
          </div>
        `,
      }),
    })

    const emailData = await emailRes.json()

    if (!emailRes.ok) {
      console.error("Resend error:", emailData)
      return jsonResponse({
        success: true,
        warning: "EMAIL_NOTIFICATION_FAILED",
      })
    }

    return jsonResponse({ success: true })
  } catch (err) {
    console.error("send-contact error:", err)
    return jsonResponse({ error: "SERVER_ERROR" }, 500)
  }
})