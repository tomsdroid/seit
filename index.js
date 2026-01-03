require('dotenv').config();
const { Telegraf } = require('telegraf');
const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');

const startServer = require('./server');
const memberHandler = require('./handlers/memberHandler');
const eventHandler = require('./handlers/eventHandler');

const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const redis = new Redis(process.env.REDIS_URL);

bot.context.db = redis;
bot.context.ownerId = process.env.OWNER_ID;

// --- MIDDLEWARE: AUTO-DELETE PESAN BOT & ADMIN (3 DETIK) ---
bot.use(async (ctx, next) => {
    // Simpan fungsi reply asli
    const originalReply = ctx.reply;

    // Modifikasi fungsi ctx.reply
    ctx.reply = async (...args) => {
        const msg = await originalReply.apply(ctx, args);
        
        // Hanya jalankan auto-delete jika di grup (bukan private chat)
        if (ctx.chat.type !== 'private') {
            try {
                // Cek status bot di grup
                const botMember = await ctx.getChatMember(ctx.botInfo.id);
                
                // Jika bot adalah Admin
                if (botMember.status === 'administrator' || botMember.status === 'creator') {
                    setTimeout(async () => {
                        // 1. Hapus pesan respon dari bot
                        await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
                        
                        // 2. Hapus pesan perintah dari Admin/User
                        if (ctx.message && ctx.message.message_id) {
                            await ctx.deleteMessage().catch(() => {});
                        }
                    }, 3000);
                }
            } catch (e) {
                console.error("Gagal hapus pesan:", e.message);
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
            const command = require(path.join(commandsPath, file));
            if (command && command.name) {
                bot.command(command.name, (ctx) => command.execute(ctx));
            }
        }
    });
}

// --- EVENT HANDLERS ---
bot.on('chat_member', (ctx) => memberHandler(ctx));
bot.on('new_chat_members', (ctx) => memberHandler(ctx));
bot.on('photo', (ctx) => eventHandler(ctx));

async function main() {
    try {
        startServer(bot, redis);
        await bot.launch({
            allowedUpdates: ['message', 'chat_member', 'new_chat_members', 'callback_query']
        });
        console.log('🚀 SEIT System Online: Auto-Delete Active (3s)');
    } catch (error) {
        console.error('Startup Error:', error.message);
    }
}

main();

process.once('SIGINT', () => { bot.stop('SIGINT'); process.exit(); });
process.once('SIGTERM', () => { bot.stop('SIGTERM'); process.exit(); });
