import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizeProvider(raw: unknown) {
  const p = String(raw || "").trim().toLowerCase();
  if (["t-money", "tmoney", "t money"].includes(p)) return "T-Money";
  if (["moov money", "moov", "flooz", "moov africa", "moov togo money"].includes(p)) return "Moov Money";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const auth = req.headers.get("Authorization");
  if (!auth) return json({ error: "not_authenticated" }, 401);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return json({ error: "SERVER_CONFIGURATION_ERROR" }, 500);

  const userClient = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return json({ error: "not_authenticated" }, 401);

  const body = await req.json().catch(() => null);
  const amount = Number(body?.amount);
  const currency = String(body?.currency || "XOF").toUpperCase();
  const phone = String(body?.phone || user.phone || "");
  const provider = normalizeProvider(body?.provider);

  if (!Number.isFinite(amount) || amount <= 0 || amount % 5 !== 0) return json({ error: "amount_must_be_positive_multiple_of_5" }, 400);
  if (!provider) return json({ error: "withdrawal_provider_not_supported_for_this_adapter", message: "Carte bancaire payout requires a separate bank/card payout agreement." }, 400);

  const apikey = Deno.env.get("CINETPAY_APIKEY");
  const password = Deno.env.get("CINETPAY_API_PASSWORD");
  if (!apikey || !password) return json({ error: "CINETPAY_NOT_CONFIGURED", message: "CinetPay transfer credentials are not configured in Supabase secrets." }, 503);
  if (!/^\+?[0-9]{8,15}$/.test(phone.replace(/\s/g, ""))) return json({ error: "invalid_phone" }, 400);

  const digits = phone.replace(/\s/g, "").replace(/^\+/, "");
  const prefix = digits.slice(0, 3);
  const local = digits.slice(3);
  const admin = createClient(url, service);
  const clientIdem = typeof body?.idempotency_key === "string" && body.idempotency_key.trim() ? body.idempotency_key.trim().slice(0, 128) : null;

  const { data: account } = await admin.from("accounts").select("id").eq("user_id", user.id).eq("is_active", true).maybeSingle();
  if (account && !clientIdem) {
    const since = new Date(Date.now() - 15000).toISOString();
    const { data: recent } = await admin.from("withdrawals").select("id,provider_reference,status").eq("account_id", account.id).eq("provider", provider).eq("amount", amount).eq("status", "pending").gte("created_at", since).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (recent) return json({ success: true, withdrawal_id: recent.id, provider_reference: recent.provider_reference, reused: true });
  }

  const idem = clientIdem || crypto.randomUUID();
  const { data: withdrawal, error: withdrawalError } = await userClient.rpc("create_withdrawal_intent", {
    p_amount: amount,
    p_provider: provider,
    p_currency: currency,
    p_idempotency_key: idem,
  });
  if (withdrawalError || !withdrawal) return json({ error: withdrawalError?.message || "withdrawal_intent_failed" }, 400);
  if (withdrawal.provider_reference && withdrawal.status !== "pending") return json({ success: true, withdrawal_id: withdrawal.id, provider_reference: withdrawal.provider_reference, reused: true, status: withdrawal.status });

  const transactionId = `SP${withdrawal.id.replaceAll("-", "").slice(0, 28)}`;
  const { error: referenceError } = await admin.from("withdrawals").update({ provider_reference: transactionId }).eq("id", withdrawal.id);
  if (referenceError) {
    await admin.rpc("settle_withdrawal", { p_withdrawal_id: withdrawal.id, p_provider_reference: transactionId, p_success: false });
    return json({ error: "withdrawal_reference_persist_failed" }, 500);
  }

  const refundOnFailure = async () => admin.rpc("settle_withdrawal", { p_withdrawal_id: withdrawal.id, p_provider_reference: transactionId, p_success: false });

  const tokenResponse = await fetch("https://client.cinetpay.com/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ apikey, password, lang: "fr" }),
  });
  const tokenJson = await tokenResponse.json().catch(() => ({}));
  const token = tokenJson?.data?.token;
  if (tokenJson?.code !== 0 || !token) {
    await refundOnFailure();
    return json({ error: "cinetpay_auth_failed" }, 502);
  }

  const notifyUrl = `${url}/functions/v1/cinetpay-payout-webhook`;
  const paymentMethod = provider === "T-Money" ? "TMONEYTG" : "MOOVTG";
  const payload = [{ prefix, phone: local, amount, client_transaction_id: transactionId, notify_url: notifyUrl, payment_method: paymentMethod }];
  const payout = await fetch("https://client.cinetpay.com/v1/transfer/money/send/contact?lang=fr", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token, data: JSON.stringify(payload) }),
  });
  const payoutJson = await payout.json().catch(() => ({}));
  if (payoutJson?.code !== 0) {
    await refundOnFailure();
    return json({ error: "cinetpay_payout_init_failed", provider: payoutJson }, 502);
  }

  const item = payoutJson?.data?.[0];
  if (!item) {
    await refundOnFailure();
    return json({ error: "cinetpay_payout_empty_response" }, 502);
  }

  const { error: processingError } = await admin.from("withdrawals").update({ status: "processing" }).eq("id", withdrawal.id);
  if (processingError) return json({ error: "withdrawal_status_update_failed" }, 500);
  return json({ success: true, withdrawal_id: withdrawal.id, provider_reference: transactionId, status: item?.treatment_status || "NEW" });
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
