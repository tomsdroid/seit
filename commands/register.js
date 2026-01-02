const moment = require('moment-timezone');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
    name: 'register',
    execute: async (ctx) => {
        if (ctx.chat.type === 'private') return;

        // --- TAMBAHAN: Jam Operasional ---
        const now = moment().tz(process.env.TIMEZONE);
        const start = moment.tz(process.env.START_TIME, "HH:mm", process.env.TIMEZONE);
        const end = moment.tz(process.env.END_TIME, "HH:mm", process.env.TIMEZONE);

        if (now.isBefore(start) || now.isAfter(end)) {
            const off = await ctx.reply("💤 Bot sedang istirahat.");
            await delay(3000);
            await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
            return ctx.deleteMessage(off.message_id).catch(() => {});
        }

        try {
            // No 1: Cek Bot Admin
            const botSelf = await ctx.getChatMember(ctx.botInfo.id);
            if (botSelf.status !== 'administrator') {
                const warn = await ctx.reply("⚠️ Jadikan saya admin terlebih dahulu!");
                await delay(3000);
                await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
                return ctx.deleteMessage(warn.message_id).catch(() => {});
            }

            // No 2: Cek Pengirim (Admin/Owner)
            const user = await ctx.getChatMember(ctx.from.id);
            const isAuthorized = ['administrator', 'creator'].includes(user.status) || ctx.from.id == ctx.ownerId;
            if (!isAuthorized) return;

            // No 3: Simpan DB (Logic Asli)
            const isTopic = ctx.message.is_topic_message;
            const threadId = isTopic ? ctx.message.message_thread_id : null;
            
            let raw = await ctx.db.get('seit_bot_db');
            let db = raw ? JSON.parse(raw) : { groups: [] };

            if (!db.groups.find(g => g.id === ctx.chat.id && g.topic_id === threadId)) {
                db.groups.push({ id: ctx.chat.id, name: ctx.chat.title, topic_id: threadId });
                await ctx.db.set('seit_bot_db', JSON.stringify(db));
            }

            // NOTIFIKASI SESUAI REQUEST
            const successText = 
                `✅ <b>GROUP BERHASIL DITAMBAHKAN</b>\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📌 Grup / Forum: ${ctx.chat.title}\n` +
                `🆔 ID / Thread ID: <code>${ctx.chat.id}${threadId ? ' / ' + threadId : ''}</code>\n` +
                `👤 Oleh: ${ctx.from.first_name}`;

            const msg = await ctx.replyWithHTML(successText);
            
            // Hapus otomatis 3 detik (Pesan admin & Bot)
            await delay(3000);
            await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
            await ctx.deleteMessage(msg.message_id).catch(() => {});

        } catch (e) { console.error(e); }
    }
};
