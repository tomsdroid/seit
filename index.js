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

// --- MIDDLEWARE: AUTO-DELETE PESAN BOT & ADMIN (3 DETIK) ---
bot.use(async (ctx, next) => {
    const originalReply = ctx.reply;

    // Modifikasi fungsi reply agar otomatis hapus
    ctx.reply = async (...args) => {
        const msg = await originalReply.apply(ctx, args);
        
        // Hapus otomatis jika di grup dan bot adalah admin
        if (ctx.chat.type !== 'private') {
            try {
                const botMember = await ctx.getChatMember(ctx.botInfo.id);
                if (botMember.status === 'administrator' || botMember.status === 'creator') {
                    setTimeout(async () => {
                        // Hapus balasan bot
                        await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
                        // Hapus perintah dari user/admin
                        if (ctx.message) {
                            await ctx.deleteMessage().catch(() => {});
                        }
                    }, 3000);
                }
            } catch (e) {
                // Abaikan jika gagal hapus
            }
        }
        return msg;
    };
    return next();
});

// --- AUTO MAPPING COMMANDS ---
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (file.endsWith('.js')) {
            try {
                const command = require(path.join(commandsPath, file));
                if (command && command.name) {
                    bot.command(command.name, (ctx) => command.execute(ctx));
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

        // 2. Jalankan Bot Telegram
        await bot.launch({
            allowedUpdates: ['message', 'chat_member', 'new_chat_members', 'callback_query']
        });

        // 3. Kirim Log Startup ke Owner
        const startLog = 
            `✅ <b>SYSTEM SEIT ONLINE</b>\n` +
            `━━━━━━━━━━━━━━━\n` +
            `📅 Tanggal: <code>${moment().tz("Asia/Jakarta").format('DD-MM-YYYY')}</code>\n` +
            `⏰ Waktu: <code>${moment().tz("Asia/Jakarta").format('HH:mm:ss')}</code>\n` +
            `🤖 Status: <b>Aktif & Sinkron</b>\n` +
            `🗑️ Auto-Delete: <b>3 Detik (Admin Only)</b>`;

        await bot.telegram.sendMessage(bot.context.ownerId, startLog, { parse_mode: 'HTML' });
        console.log('🚀 SEIT System Online & Log sent to Owner');

    } catch (error) {
        console.error('❌ Gagal menjalankan aplikasi:', error.message);
    }
}

// Handle penghentian halus
process.once('SIGINT', () => { bot.stop('SIGINT'); process.exit(); });
process.once('SIGTERM', () => { bot.stop('SIGTERM'); process.exit(); });

main();
