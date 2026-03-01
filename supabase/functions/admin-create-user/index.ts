import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-admin-secret, content-type",
}

serve(async (req) => {

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // 🔐 Check admin secret
    const adminSecret = req.headers.get("x-admin-secret")

    if (adminSecret !== Deno.env.get("ADMIN_SECRET")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      })
    }

    const { email, password } = await req.json()

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!  // مهم تستخدم الاسم اللي خزّنته
    )

    const { data: test, error: testError } = await supabase
  .from("auth.users")
  .select("id")
  .limit(1)

return new Response(
  JSON.stringify({
    testError
  }),
  { status: 200, headers: corsHeaders }
)