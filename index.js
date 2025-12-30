require('dotenv').config();
const { Telegraf } = require('telegraf');
const { WebhookClient } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Import features & handlers
const loginInstagram = require('./features/igLogin');
const memberHandler = require('./handlers/memberHandler');
const eventHandler = require('./handlers/eventHandler');

// Inisialisasi Bot & Webhook
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const discordWebhook = new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL });

let igInstance;

// --- 1. LOAD COMMANDS ---
// Membaca semua file di folder 'commands' secara otomatis
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (file.endsWith('.js')) {
            const command = require(`./commands/${file}`);
            bot.command(command.name, (ctx) => command.execute(ctx));
        }
    });
    console.log('✅ Commands loaded successfully');
}

// --- 2. EVENT HANDLERS ---
bot.on('new_chat_members', (ctx) => memberHandler(ctx));

// Menangani postingan foto (Otomasi ke Telegram, Discord, Instagram)
bot.on('photo', (ctx) => {
    if (igInstance) {
        eventHandler(ctx, igInstance, discordWebhook);
    } else {
        console.log('⚠️ IG Instance belum siap, melewati proses posting.');
    }
});

// --- 3. STARTUP LOGIC ---

async function startApp() {
    console.log('🔄 Memulai bot di Termux...');
    
    try {
        // Login Instagram (Fitur Session Management)
        igInstance = await loginInstagram();
        
        // Jalankan Bot Telegram
        // allowedUpdates memastikan bot menangkap aktivitas member di grup
        await bot.launch({
            allowedUpdates: ['message', 'chat_member', 'new_chat_members', 'callback_query']
        });
        
    } catch (error) {
        console.error('❌ Gagal menjalankan aplikasi:', error.message);
        // Coba jalankan bot saja jika IG gagal (opsional)
        bot.launch();
    }
}

// Handle penghentian bot secara halus
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

startApp();
