import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function normalizeProvider(raw: unknown): string | null {
  const p = String(raw || "").trim().toLowerCase();
  if (["t-money", "tmoney", "t money"].includes(p)) return "T-Money";
  if (["moov money", "moov", "flooz", "moov africa"].includes(p)) return "Moov Money";
  if (["orange money", "orange"].includes(p)) return "Orange Money";
  if (["mtn momo", "mtn", "momo"].includes(p)) return "MTN MoMo";
  if (["wave"].includes(p)) return "Wave";
  if (["free money", "free"].includes(p)) return "Free Money";
  if (["airtel money", "airtel"].includes(p)) return "Airtel Money";
  if (p) return String(raw).trim();
  return null;
}

/** Map opérateur → channels CinetPay (Togo-centric; étendre selon contrat). */
function cinetpayChannels(provider: string, country: string): string {
  const p = provider.toLowerCase();
  const c = country.toUpperCase();
  if (c === "TG") {
    if (p.includes("t-money") || p.includes("tmoney")) return "TMONEYTG";
    if (p.includes("moov")) return "MOOVTG";
  }
  if (c === "BF") {
    if (p.includes("orange")) return "OMBF";
    if (p.includes("moov")) return "MOOVBF";
  }
  // fallback: laisser CinetPay décider via channels MOBILE_MONEY
  return "MOBILE_MONEY";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "not_authenticated" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const siteId = Deno.env.get("CINETPAY_SITE_ID");
  const apiKey = Deno.env.get("CINETPAY_APIKEY") || Deno.env.get("CINETPAY_API_KEY");
  const notifyBase = Deno.env.get("CINETPAY_NOTIFY_URL") || `${url}/functions/v1/cinetpay-webhook`;

  if (!url || !anon || !service) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

  if (!siteId || !apiKey) {
    return json(
      {
        error: "CINETPAY_NOT_CONFIGURED",
        message:
          "Clés CinetPay manquantes (CINETPAY_SITE_ID / CINETPAY_APIKEY). Configurez-les dans les secrets Supabase pour activer le collect Mobile Money.",
      },
      503
    );
  }

  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "not_authenticated" }, 401);

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  const currency = String(body?.currency || "XOF").toUpperCase();
  const phone = String(body?.phone || user.phone || "").replace(/\s/g, "");
  const provider = normalizeProvider(body?.provider);
  const country = String(body?.country || "TG").toUpperCase();
  const returnUrl = String(body?.return_url || "").trim();
  const clientIdem =
    typeof body?.idempotency_key === "string" && body.idempotency_key.trim()
      ? body.idempotency_key.trim().slice(0, 128)
      : crypto.randomUUID();
  const transactionId = body?.transaction_id ? String(body.transaction_id) : null;
  const existingDepositId = body?.deposit_id ? String(body.deposit_id) : null;

  if (!Number.isFinite(amount) || amount <= 0) {
    return json({ error: "invalid_amount" }, 400);
  }
  if (!provider) return json({ error: "unsupported_provider" }, 400);
  if (!/^\+?[0-9]{8,15}$/.test(phone)) return json({ error: "invalid_phone" }, 400);

  const admin = createClient(url, service);

  // Intent deposit (ou réutilise celui lié à la TX)
  let depositId = existingDepositId;
  if (!depositId) {
    const { data: deposit, error: depErr } = await userClient.rpc("create_deposit_intent", {
      p_amount: amount,
      p_provider: provider,
      p_currency: currency,
      p_idempotency_key: clientIdem,
    });
    if (depErr || !deposit) {
      return json({ error: depErr?.message || "deposit_intent_failed" }, 400);
    }
    depositId = deposit.id;
  }

  // transaction_id CinetPay stable
  const cinetpayTxId = `CY${String(depositId).replaceAll("-", "").slice(0, 28)}`;

  await admin
    .from("deposits")
    .update({
      provider_reference: cinetpayTxId,
      status: "processing",
      ...(transactionId ? { transaction_id: transactionId } : {}),
    })
    .eq("id", depositId);

  const channels = cinetpayChannels(provider, country);
  const description = transactionId
    ? `Cyenoo TX ${transactionId.slice(0, 8)}`
    : `Cyenoo recharge ${amount} ${currency}`;

  // API CheckOut CinetPay
  const payload = {
    apikey: apiKey,
    site_id: siteId,
    transaction_id: cinetpayTxId,
    amount: Math.round(amount),
    currency,
    description,
    customer_phone_number: phone.startsWith("+") ? phone : `+${phone}`,
    notify_url: notifyBase,
    return_url: returnUrl || `${Deno.env.get("APP_URL") || "https://safepay-togo.vercel.app"}/wallet`,
    channels,
    lang: "fr",
    metadata: JSON.stringify({
      deposit_id: depositId,
      transaction_id: transactionId,
      user_id: user.id,
      provider,
      country,
    }),
  };

  const initRes = await fetch("https://api-checkout.cinetpay.com/v2/payment",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  const initJson = await initRes.json().catch(() => ({}));

  // code 201 = success CinetPay checkout
  if (initJson?.code !== "201" && initJson?.code !== 201) {
    await admin.from("deposits").update({ status: "failed" }).eq("id", depositId);
    return json(
      {
        error: "cinetpay_init_failed",
        message: initJson?.message || initJson?.description || "Échec initialisation CinetPay",
        provider: initJson,
      },
      502
    );
  }

  const paymentUrl = initJson?.data?.payment_url || initJson?.data?.payment_url;

  return json({
    success: true,
    deposit_id: depositId,
    provider_reference: cinetpayTxId,
    payment_url: paymentUrl,
    status: "processing",
  });
});
