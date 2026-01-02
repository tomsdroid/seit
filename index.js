require('dotenv').config();
const { Telegraf } = require('telegraf');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

// Import Server & Handlers
const startServer = require('./server');
const memberHandler = require('./handlers/memberHandler');
const eventHandler = require('./handlers/eventHandler');

// Inisialisasi Bot & Database
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const redis = new Redis(process.env.REDIS_URL);

// --- GLOBAL CONTEXT ---
// Agar db dan ownerId bisa diakses di file lain melalui ctx.db / ctx.ownerId
bot.context.db = redis;
bot.context.ownerId = process.env.OWNER_ID;

// --- AUTO MAPPING COMMANDS ---
// Membaca semua file .js di dalam folder /commands secara otomatis
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    fs.readdirSync(commandsPath).forEach(file => {
        if (file.endsWith('.js')) {
            const command = require(path.join(commandsPath, file));
            // Mapping: bot.command('nama_file', fungsi_execute)
            bot.command(command.name, (ctx) => command.execute(ctx));
        }
    });
    console.log('✅ Commands auto-mapped successfully');
}

// --- EVENT HANDLERS ---
// Menangani member masuk/keluar (Gatekeeper)
bot.on('chat_member', (ctx) => memberHandler(ctx));
bot.on('new_chat_members', (ctx) => memberHandler(ctx));

// Menangani postingan event (Broadcast system)
bot.on('photo', (ctx) => eventHandler(ctx));

// --- STRATEGI STARTUP (PARALLEL) ---
async function main() {
    try {
        console.log('🔄 Memulai SEIT System...');

        // 1. Jalankan Dashboard Express duluan
        // Ini agar port 3000 langsung terbuka tanpa menunggu koneksi Telegram
        startServer(bot, redis);
        await bot.telegram.sendMessage(
            process.env.OWNER_ID, 
            "✅ <b>Sistem Berhasil Dimuat!</b>\nBot dan Dashboard telah aktif secara sinkron.", 
            { parse_mode: 'HTML' }
        ).catch(() => console.log('⚠️ Gagal mengirim log startup ke Owner.'));

        // 2. Jalankan Bot Telegram
        await bot.launch({
            allowedUpdates: ['message', 'chat_member', 'new_chat_members', 'callback_query']
        });
        console.log('🚀 Bot Telegram SEIT sedang berjalan...');

        // 3. Laporan Status ke Owner
        await bot.telegram.sendMessage(
            process.env.OWNER_ID, 
            "✅ <b>Sistem Berhasil Dimuat!</b>\nBot dan Dashboard telah aktif secara sinkron.", 
            { parse_mode: 'HTML' }
        ).catch(() => console.log('⚠️ Gagal mengirim log startup ke Owner.'));

    } catch (error) {
        console.error('❌ Gagal menjalankan aplikasi:', error.message);
        // Tetap usahakan server jalan jika bot error
        startServer(bot, redis);
    }
}

// Menangani penghentian bot secara halus
process.once('SIGINT', () => {
    bot.stop('SIGINT');
    process.exit();
});
process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    process.exit();
});

// Eksekusi
main();
