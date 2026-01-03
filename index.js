require('dotenv').config();
const { Telegraf } = require('telegraf');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const moment = require('moment-timezone');

// Import Server & Handlers
const startServer = require('./server');
const memberHandler = require('./handlers/memberHandler');
const eventHandler = require('./handlers/eventHandler');

// Inisialisasi Bot & Database
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const redis = new Redis(process.env.REDIS_URL);

// --- GLOBAL CONTEXT ---
bot.context.db = redis;
bot.context.ownerId = process.env.OWNER_ID || "5803538088";

// --- AUTO MAPPING COMMANDS ---
// Tetap mendukung struktur kode asli Anda (fungsi langsung)
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (file.endsWith('.js')) {
            try {
                const command = require(path.join(commandsPath, file));
                
                // Logika agar tetap bisa membaca module.exports = async (ctx) => {}
                const commandName = command.name || file.split('.')[0];
                const commandExecute = typeof command === 'function' ? command : command.execute;

                if (commandExecute) {
                    bot.command(commandName, (ctx) => commandExecute(ctx));
                }
            } catch (err) {
                console.error(`❌ Gagal mapping ${file}:`, err.message);
            }
        }
    });
}

// --- EVENT HANDLERS ---
bot.on('chat_member', (ctx) => memberHandler(ctx));
bot.on('new_chat_members', (ctx) => memberHandler(ctx));
bot.on('photo', (ctx) => eventHandler(ctx));

// --- STRATEGI STARTUP ---
async function main() {
    try {
        console.log('🔄 Memulai SEIT System...');

        // 1. Jalankan Dashboard Express
        startServer(bot, redis);
        
        // 2. Kirim Log Startup ke Owner ID (5803538088)
        const startLog = 
            `🚀 <b>SYSTEM SEIT ONLINE</b>\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `✨ <b>Status:</b> <code>Online & Synchronized</code>\n` +
            `📅 <b>Date  :</b> <code>${moment().tz("Asia/Jakarta").format('DD/MM/YYYY')}</code>\n` +
            `⏰ <b>Time  :</b> <code>${moment().tz("Asia/Jakarta").format('HH:mm:ss')} WIB</code>\n` +
            `━━━━━━━━━━━━━━━━━━\n` +
            `💡 <i>Sedang Memantau Group.</i>`;

        await bot.telegram.sendMessage(bot.context.ownerId, startLog, { parse_mode: 'HTML' });
        console.log('🚀 SEIT System Online & Log sent to Owner');

        // 3. Jalankan Bot Telegram
        await bot.telegram.deleteWebhook({ drop_pending_updates: true });
        console.log('🧹 Sisa koneksi lama dibersihkan...');
        await bot.launch({
            allowedUpdates: ['message', 'chat_member', 'new_chat_members', 'callback_query']
        });

    } catch (error) {
        console.error('❌ Gagal menjalankan aplikasi:', error.message);
    }
}

// Handle penghentian halus
process.once('SIGINT', () => { bot.stop('SIGINT'); process.exit(); });
process.once('SIGTERM', () => { bot.stop('SIGTERM'); process.exit(); });

main();
