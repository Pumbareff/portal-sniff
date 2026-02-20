/**
 * List all WhatsApp groups to find the group ID
 * Run: npm run list-groups
 * Scan QR code, then it lists all groups and exits
 */

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const path = require('path');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.join(__dirname, '.wwebjs_auth') }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

client.on('qr', (qr) => {
  console.log('\nEscaneie o QR code:\n');
  qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
  console.log('\n[OK] WhatsApp conectado! Listando grupos...\n');

  try {
    const chats = await client.getChats();
    const groups = chats.filter(c => c.isGroup);

    if (groups.length === 0) {
      console.log('Nenhum grupo encontrado.');
    } else {
      console.log('========================================');
      console.log(`  ${groups.length} GRUPO(S) ENCONTRADO(S)`);
      console.log('========================================\n');
      groups.forEach((g, i) => {
        console.log(`  ${i + 1}. ${g.name}`);
        console.log(`     ID: ${g.id._serialized}`);
        console.log(`     Participantes: ${g.participants?.length || '?'}`);
        console.log('');
      });
      console.log('========================================');
      console.log('Copie o ID do grupo desejado e cole no .env:');
      console.log('WHATSAPP_GROUP_ID=<ID_AQUI>');
      console.log('========================================\n');
    }
  } catch (e) {
    console.error('Erro ao listar grupos:', e.message);
  }

  await client.destroy();
  process.exit(0);
});

console.log('\n=== Listar Grupos WhatsApp ===\n');
client.initialize();
