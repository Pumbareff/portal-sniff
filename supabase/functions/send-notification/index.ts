// Edge Function: send-notification
// Handles Email (Resend) and WhatsApp (Evolution API) notifications
// Deploy: supabase functions deploy send-notification
// Secrets needed:
//   RESEND_API_KEY - from resend.com
//   EVOLUTION_API_URL - Evolution API base URL (ex: https://evo.sniffhome.com.br)
//   EVOLUTION_API_KEY - Evolution API token
//   EVOLUTION_INSTANCE - Evolution instance name
//   NOTIFICATION_EMAIL_FROM - sender email (ex: pedidos@sniffhome.com.br)
//   NOTIFICATION_EMAIL_TO - admin email (ex: lucas@sniffhome.com.br)
//   NOTIFICATION_WHATSAPP_TO - admin WhatsApp (ex: 5511999999999)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  channel: "email" | "whatsapp";
  type: "overdue_price" | "overdue_faturamento" | "status_change" | "new_order";
  pedido_id: string;
  numero_oc: string;
  fornecedor: string;
  status: string;
  valor_total: number;
  timestamp: string;
}

// --- MESSAGE TEMPLATES ---
const templates: Record<string, { subject: string; body: string }> = {
  overdue_price: {
    subject: "ALERTA: Aprovacao de Preco Atrasada - {numero_oc}",
    body: `Pedido *{numero_oc}* do fornecedor *{fornecedor}* esta aguardando aprovacao de preco da NEXT ha mais de 24 horas.\n\nValor: R$ {valor_total}\nStatus: Aprov. Preco NEXT\n\nAcesse o portal para acompanhar: https://portal-sniff.vercel.app`,
  },
  overdue_faturamento: {
    subject: "ALERTA: Faturamento Atrasado - {numero_oc}",
    body: `Pedido *{numero_oc}* do fornecedor *{fornecedor}* esta aguardando faturamento da NEXT ha mais de 7 dias uteis.\n\nValor: R$ {valor_total}\nStatus: A Faturar\n\nAcesse o portal para acompanhar: https://portal-sniff.vercel.app`,
  },
  status_change: {
    subject: "Pedido {numero_oc} - Status Atualizado",
    body: `O pedido *{numero_oc}* do fornecedor *{fornecedor}* mudou para status: *{status}*.\n\nValor: R$ {valor_total}\n\nAcesse o portal: https://portal-sniff.vercel.app`,
  },
  new_order: {
    subject: "Nova Ordem de Compra - {numero_oc}",
    body: `Nova ordem de compra *{numero_oc}* criada para o fornecedor *{fornecedor}*.\n\nValor: R$ {valor_total}\n\nAcesse o portal: https://portal-sniff.vercel.app`,
  },
};

function renderTemplate(template: { subject: string; body: string }, data: NotificationPayload) {
  const replace = (str: string) =>
    str
      .replace(/{numero_oc}/g, data.numero_oc)
      .replace(/{fornecedor}/g, data.fornecedor)
      .replace(/{status}/g, data.status)
      .replace(/{valor_total}/g, (data.valor_total || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
  return { subject: replace(template.subject), body: replace(template.body) };
}

// --- EMAIL VIA RESEND ---
async function sendEmail(payload: NotificationPayload) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NOTIFICATION_EMAIL_FROM") || "pedidos@sniffhome.com.br";
  const to = Deno.env.get("NOTIFICATION_EMAIL_TO") || "lucas@sniffhome.com.br";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not configured, skipping email");
    return { success: false, error: "RESEND_API_KEY not set" };
  }

  const template = templates[payload.type];
  if (!template) return { success: false, error: `Unknown type: ${payload.type}` };

  const { subject, body } = renderTemplate(template, payload);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text: body,
      html: `<pre style="font-family: system-ui, sans-serif; white-space: pre-wrap;">${body.replace(/\*/g, "")}</pre>`,
    }),
  });

  const result = await res.json();
  return { success: res.ok, data: result };
}

// --- WHATSAPP VIA EVOLUTION API ---
async function sendWhatsApp(payload: NotificationPayload) {
  const baseUrl = Deno.env.get("EVOLUTION_API_URL");
  const apiKey = Deno.env.get("EVOLUTION_API_KEY");
  const instance = Deno.env.get("EVOLUTION_INSTANCE") || "sniff-bot";
  const to = Deno.env.get("NOTIFICATION_WHATSAPP_TO");

  if (!baseUrl || !apiKey || !to) {
    console.warn("Evolution API not fully configured, skipping WhatsApp");
    return { success: false, error: "Evolution API config incomplete" };
  }

  const template = templates[payload.type];
  if (!template) return { success: false, error: `Unknown type: ${payload.type}` };

  const { body } = renderTemplate(template, payload);

  const res = await fetch(`${baseUrl}/message/sendText/${instance}`, {
    method: "POST",
    headers: { apikey: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      number: to,
      text: body,
    }),
  });

  const result = await res.json();
  return { success: res.ok, data: result };
}

// --- HANDLER ---
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload: NotificationPayload = await req.json();
    let result;

    if (payload.channel === "email") {
      result = await sendEmail(payload);
    } else if (payload.channel === "whatsapp") {
      result = await sendWhatsApp(payload);
    } else {
      return new Response(JSON.stringify({ error: "Invalid channel" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
