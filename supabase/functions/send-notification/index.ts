// Edge Function: send-notification
// Handles Email (Resend) and WhatsApp (Z-API) notifications
// Deploy: supabase functions deploy send-notification
// Secrets needed:
//   RESEND_API_KEY - from resend.com
//   ZAPI_INSTANCE_ID - Z-API instance ID (from painel z-api.io)
//   ZAPI_TOKEN - Z-API instance token
//   ZAPI_GROUP_ID - WhatsApp group JID (ex: 120363xxxxx@g.us)
//   NOTIFICATION_EMAIL_FROM - sender email (ex: pedidos@sniffhome.com.br)
//   NOTIFICATION_EMAIL_TO - admin email (ex: lucas@sniffhome.com.br)

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
  itens_resumo?: string;
  timestamp: string;
}

// --- MESSAGE TEMPLATES ---
const templates: Record<string, { subject: string; body: string }> = {
  overdue_price: {
    subject: "ALERTA: Aprovacao de Preco Atrasada - {numero_oc}",
    body: `⚠️ *ALERTA - Aprovacao de Preco Atrasada*

📋 *OC:* {numero_oc}
🏭 *Fornecedor:* {fornecedor}
💰 *Valor:* R$ {valor_total}
📌 *Status:* Aprov. Preco NEXT

⏰ Aguardando aprovacao ha mais de 24 horas.

🔗 https://portal-sniff.vercel.app`,
  },
  overdue_faturamento: {
    subject: "ALERTA: Faturamento Atrasado - {numero_oc}",
    body: `🚨 *ALERTA - Faturamento Atrasado*

📋 *OC:* {numero_oc}
🏭 *Fornecedor:* {fornecedor}
💰 *Valor:* R$ {valor_total}
📌 *Status:* A Faturar

⏰ Aguardando faturamento ha mais de 7 dias uteis.

🔗 https://portal-sniff.vercel.app`,
  },
  status_change: {
    subject: "Pedido {numero_oc} - Status Atualizado",
    body: `📦 *Pedido Atualizado*

📋 *OC:* {numero_oc}
🏭 *Fornecedor:* {fornecedor}
💰 *Valor:* R$ {valor_total}
📌 *Novo Status:* {status}

🔗 https://portal-sniff.vercel.app`,
  },
  new_order: {
    subject: "Nova Ordem de Compra - {numero_oc}",
    body: `✅ *Nova Ordem de Compra Criada*

📋 *OC:* {numero_oc}
🏭 *Fornecedor:* {fornecedor}
💰 *Valor Total:* R$ {valor_total}
📦 *Itens:* {itens_resumo}

🔗 https://portal-sniff.vercel.app`,
  },
};

function renderTemplate(template: { subject: string; body: string }, data: NotificationPayload) {
  const replace = (str: string) =>
    str
      .replace(/{numero_oc}/g, data.numero_oc || "")
      .replace(/{fornecedor}/g, data.fornecedor || "")
      .replace(/{status}/g, data.status || "")
      .replace(/{itens_resumo}/g, data.itens_resumo || "")
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

// --- WHATSAPP VIA Z-API (GROUP) ---
async function sendWhatsApp(payload: NotificationPayload) {
  const instanceId = Deno.env.get("ZAPI_INSTANCE_ID");
  const token = Deno.env.get("ZAPI_TOKEN");
  const groupId = Deno.env.get("ZAPI_GROUP_ID");

  if (!instanceId || !token || !groupId) {
    console.warn("Z-API not fully configured, skipping WhatsApp");
    return { success: false, error: "Z-API config incomplete (need ZAPI_INSTANCE_ID, ZAPI_TOKEN, ZAPI_GROUP_ID)" };
  }

  const template = templates[payload.type];
  if (!template) return { success: false, error: `Unknown type: ${payload.type}` };

  const { body } = renderTemplate(template, payload);

  const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone: groupId,
      message: body,
    }),
  });

  const result = await res.json();
  console.log("Z-API response:", JSON.stringify(result));
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
