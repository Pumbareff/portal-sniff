/**
 * Portal Sniff - WhatsApp Bot
 *
 * Polls Supabase whatsapp_queue table for pending messages
 * and sends them to a WhatsApp group via whatsapp-web.js.
 *
 * Usage:
 *   1. npm install
 *   2. Set SUPABASE_URL, SUPABASE_KEY, WHATSAPP_GROUP_ID in .env
 *   3. npm start
 *   4. Scan QR code with WhatsApp
 *   5. Bot runs forever, polling every 15 seconds
 *
 * First run: list groups with `npm run list-groups` to find group ID
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CONFIG ---
const envPath = path.join(__dirname, '.env');
const config = {};
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const [key, ...val] = line.split('=');
    if (key && val.length) config[key.trim()] = val.join('=').trim();
  });
}

const SUPABASE_URL = config.SUPABASE_URL || 'https://shaohvrqjimlodzroazt.supabase.co';
const SUPABASE_KEY = config.SUPABASE_KEY || '';
const GROUP_ID = config.WHATSAPP_GROUP_ID || '';
const POLL_INTERVAL = parseInt(config.POLL_INTERVAL || '15000', 10); // 15 seconds

if (!SUPABASE_KEY) {
  console.error('\n[ERRO] SUPABASE_KEY nao configurado!');
  console.error('Crie o arquivo .env com:');
  console.error('  SUPABASE_URL=https://shaohvrqjimlodzroazt.supabase.co');
  console.error('  SUPABASE_KEY=eyJ... (anon key do Supabase)');
  console.error('  WHATSAPP_GROUP_ID=120363xxxxx@g.us');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- WHATSAPP CLIENT ---
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

let isReady = false;

client.on('qr', (qr) => {
  console.log('\n========================================');
  console.log('  ESCANEIE O QR CODE COM SEU WHATSAPP');
  console.log('========================================\n');
  qrcode.generate(qr, { small: true });
  console.log('\nAbra WhatsApp > Aparelhos conectados > Conectar aparelho\n');
});

client.on('ready', () => {
  isReady = true;
  console.log('\n[OK] WhatsApp conectado!');
  if (GROUP_ID) {
    console.log(`[OK] Grupo configurado: ${GROUP_ID}`);
  } else {
    console.log('[AVISO] WHATSAPP_GROUP_ID nao configurado. Use "npm run list-groups" para descobrir.');
  }
  console.log(`[OK] Polling a cada ${POLL_INTERVAL / 1000}s...`);
  console.log('[OK] Bot rodando. Ctrl+C para parar.\n');
  startPolling();
});

client.on('authenticated', () => {
  console.log('[OK] Sessao autenticada (salva localmente)');
});

client.on('auth_failure', (msg) => {
  console.error('[ERRO] Falha na autenticacao:', msg);
});

client.on('disconnected', (reason) => {
  console.log('[AVISO] WhatsApp desconectado:', reason);
  isReady = false;
});

// --- POLLING ---
async function processQueue() {
  if (!isReady || !GROUP_ID) return;

  try {
    // Fetch pending messages (oldest first, max 10 per cycle)
    const { data: messages, error } = await supabase
      .from('whatsapp_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('[ERRO] Supabase query:', error.message);
      return;
    }

    if (!messages || messages.length === 0) return;

    console.log(`[QUEUE] ${messages.length} mensagem(ns) pendente(s)`);

    for (const msg of messages) {
      try {
        // Send to group
        const chatId = GROUP_ID.includes('@') ? GROUP_ID : `${GROUP_ID}@g.us`;
        await client.sendMessage(chatId, msg.message);

        // Mark as sent
        await supabase
          .from('whatsapp_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', msg.id);

        console.log(`[SENT] ${msg.type} - ${msg.id.substring(0, 8)}`);

        // Small delay between messages to avoid spam
        await sleep(2000);
      } catch (sendErr) {
        console.error(`[ERRO] Falha ao enviar ${msg.id}:`, sendErr.message);
        await supabase
          .from('whatsapp_queue')
          .update({ status: 'failed', error_msg: sendErr.message })
          .eq('id', msg.id);
      }
    }
  } catch (e) {
    console.error('[ERRO] processQueue:', e.message);
  }
}

function startPolling() {
  processQueue(); // run immediately
  setInterval(processQueue, POLL_INTERVAL);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- START ---
console.log('\n=== Portal Sniff WhatsApp Bot ===\n');
console.log('Iniciando WhatsApp...');
client.initialize();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n[INFO] Encerrando bot...');
  await client.destroy();
  process.exit(0);
});
