const moment = require('moment-timezone');

module.exports = {
    name: 'register',
    execute: async (ctx) => {
        // 1. Cek Jam Operasional (08:00 - 22:00)
        const timezone = process.env.TIMEZONE || 'Asia/Jakarta';
        const now = moment().tz(timezone);
        const start = moment.tz("08:00", "HH:mm", timezone);
        const end = moment.tz("22:00", "HH:mm", timezone);

        if (now.isBefore(start) || now.isAfter(end)) {
            const offMsg = await ctx.reply("💤 <b>Bot sedang istirahat.</b>\nLayanan pendaftaran hanya tersedia pukul 08:00 - 22:00.", { parse_mode: 'HTML' });
            // Auto delete 3 detik
            setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, offMsg.message_id).catch(() => {}), 3000);
            return;
        }

        // Hanya izinkan di grup atau oleh owner
        if (ctx.chat.type === 'private' && ctx.from.id != ctx.ownerId) {
            return ctx.reply("❌ Command ini hanya untuk pendaftaran grup.");
        }

        const chatId = ctx.chat.id;
        const chatTitle = ctx.chat.title;

        try {
            // 2. Cek apakah Bot sudah menjadi Admin
            if (ctx.chat.type !== 'private') {
                const botMember = await ctx.getChatMember(ctx.botInfo.id);
                if (botMember.status !== 'administrator' && botMember.status !== 'creator') {
                    const adminMsg = await ctx.reply(
                        "⚠️ <b>Akses Ditolak!</b>\n" +
                        "Jadikan bot sebagai <b>Administrator</b> terlebih dahulu.",
                        { parse_mode: 'HTML' }
                    );
                    setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, adminMsg.message_id).catch(() => {}), 3000);
                    return;
                }
            }

            // Ambil data DB dari Redis
            const rawDb = await ctx.db.get('seit_bot_db');
            let db = rawDb ? JSON.parse(rawDb) : { groups: [] };

            const isExist = db.groups.find(g => g.id === chatId);
            if (isExist) {
                const existMsg = await ctx.reply("ℹ️ Grup ini sudah terdaftar.");
                setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, existMsg.message_id).catch(() => {}), 3000);
                return;
            }

            // Tambahkan grup baru
            const topicId = ctx.message.message_thread_id || null;
            db.groups.push({
                id: chatId,
                title: chatTitle,
                topic_id: topicId,
                added_at: new Date().toISOString()
            });

            await ctx.db.set('seit_bot_db', JSON.stringify(db));

            const successMsg = await ctx.reply(
                `✅ <b>Berhasil Terdaftar!</b>\n` +
                `Grup: <b>${chatTitle}</b>\n` +
                `Status: Aktif menerima broadcast.`,
                { parse_mode: 'HTML' }
            );

            // --- AUTO DELETE 3 DETIK ---
            setTimeout(() => {
                ctx.telegram.deleteMessage(ctx.chat.id, successMsg.message_id).catch(err => console.log("Gagal hapus pesan:", err.message));
                // Opsional: Hapus juga pesan perintah user agar chat bersih
                ctx.deleteMessage().catch(() => {});
            }, 3000);

        } catch (error) {
            console.error('Register Error:', error);
            const errMsg = await ctx.reply("❌ Gagal mendaftarkan grup.");
            setTimeout(() => ctx.telegram.deleteMessage(ctx.chat.id, errMsg.message_id).catch(() => {}), 3000);
        }
    }
};
