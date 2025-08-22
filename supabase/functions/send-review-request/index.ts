// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function: send-review-request
// Trigger: HTTP POST with appointment payload

import { serve } from "https://deno.land/std@0.202.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

type AppointmentPayload = {
  id: string
  client_id: string
  profile_id: string
  status?: string | null
}

type ClientRow = {
  name: string | null
  phone: string | null
}

type ProfileRow = {
  business_name: string | null
  full_name: string | null
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    status: init.status ?? 200,
  })
}

async function sendTwilioSms(
  toPhone: string,
  fromPhone: string,
  body: string,
  accountSid: string,
  authToken: string,
) {
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  const auth = btoa(`${accountSid}:${authToken}`)
  const params = new URLSearchParams()
  params.append("To", toPhone)
  params.append("From", fromPhone)
  params.append("Body", body)

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Twilio error (${res.status}): ${text}`)
  }

  return res.json()
}

serve(async (req: Request) => {
  // Handle CORS preflight (optional, harmless)
  if (req.method === "OPTIONS") {
    return new Response("", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization",
      },
    })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 })
  }

  try {
    const {
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER,
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      SITE_URL,
    } = Deno.env.toObject()

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: "Supabase credentials missing" }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const body = await req.json().catch(() => null) as { appointment?: AppointmentPayload } | AppointmentPayload | null
    if (!body) {
      return jsonResponse({ error: "Invalid JSON body" }, { status: 400 })
    }

    // Support both { appointment: {...} } and direct payload
    const appointment: AppointmentPayload | null = (body as any).appointment ?? body
    if (!appointment || !appointment.id || !appointment.client_id || !appointment.profile_id) {
      return jsonResponse({ error: "Missing required appointment fields" }, { status: 400 })
    }

    if (appointment.status && appointment.status !== "completed") {
      return jsonResponse({ skipped: true, reason: "Appointment not completed" }, { status: 200 })
    }

    // Get client phone and name
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("name, phone")
      .eq("id", appointment.client_id)
      .single<ClientRow>()

    if (clientErr) {
      return jsonResponse({ error: "Failed to fetch client", details: clientErr.message }, { status: 500 })
    }
    if (!client?.phone) {
      return jsonResponse({ error: "Client phone not found" }, { status: 400 })
    }

    // Get profile for business/owner name
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("business_name, full_name")
      .eq("id", appointment.profile_id)
      .single<ProfileRow>()

    if (profileErr) {
      return jsonResponse({ error: "Failed to fetch profile", details: profileErr.message }, { status: 500 })
    }

    const businessName = profile?.business_name || profile?.full_name || "Makas"
    const customerName = client?.name || "Müşterimiz"
    const baseUrl = SITE_URL?.replace(/\/$/, "") || "https://makas.app"
    const reviewLink = `${baseUrl}/rate/${appointment.id}`

    const smsBody = `Merhaba ${customerName}, ${businessName}'ndaki randevunuz için teşekkürler! Deneyiminizi 15 saniyede puanlayarak hizmet kalitemizi artırmamıza yardımcı olabilir misiniz? ${reviewLink}`

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      return jsonResponse({ error: "Twilio env vars missing" }, { status: 500 })
    }

    // Attempt to normalize phone (basic) — keep only digits and leading + if present
    const toPhone = client.phone.replace(/[^+\d]/g, "")
    const fromPhone = TWILIO_PHONE_NUMBER.replace(/[^+\d]/g, "")

    const twilioRes = await sendTwilioSms(
      toPhone,
      fromPhone,
      smsBody,
      TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN,
    )

    return jsonResponse({ success: true, twilio: twilioRes })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: message }, { status: 500 })
  }
})


