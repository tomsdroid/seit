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
            return ctx.reply(
                `╭─── <b>OFFLINE SYSTEM</b>\n` +
                `│\n` +
                `├ 👤 <b>Status:</b> <code>Resting</code>\n` +
                `├ ⏰ <b>Active:</b> <code>08:00 - 22:00</code>\n` +
                `│\n` +
                `╰─────── <i>Bot kembali besok pagi</i>`, 
                { parse_mode: 'HTML' }
            );
        }

        // 2. Cek Status Admin
        if (ctx.chat.type !== 'private') {
            try {
                const botMember = await ctx.getChatMember(ctx.botInfo.id);
                if (botMember.status !== 'administrator' && botMember.status !== 'creator') {
                    return ctx.reply(
                        `╭─── <b>ACCESS DENIED</b>\n` +
                        `│\n` +
                        `├ 🛡️ <b>Reason:</b> <code>Bot Not Admin</code>\n` +
                        `├ 💡 <b>Action:</b> <code>Promote Bot to Admin</code>\n` +
                        `│\n` +
                        `╰─────── <i>Bot memerlukan izin hapus</i>`,
                        { parse_mode: 'HTML' }
                    );
                }
            } catch (e) {
                console.error("Gagal verifikasi admin");
            }
        }

        // 3. Logika Pendaftaran
        const chatId = ctx.chat.id;
        const chatTitle = ctx.chat.title || "Private Chat";
        const topicId = ctx.message.message_thread_id || null;

        // Ambil nama topik jika ada
        let topicName = "General / No Topic";
        if (ctx.message.is_topic_message) {
            // Jika bot admin, kita bisa ambil info chat secara mendalam
            const chatInfo = await ctx.getChat();
            topicName = chatInfo.title || "Forum Topic"; 
        }

        try {
            const rawDb = await ctx.db.get('seit_bot_db');
            let db = rawDb ? JSON.parse(rawDb) : { groups: [] };

            const isExist = db.groups.find(g => g.id === chatId && g.topic_id === topicId);
            if (isExist) {
                return ctx.reply(`⚠️ <b>Grup/Topik ini sudah terdaftar.</b>`, { parse_mode: 'HTML' });
            }

            db.groups.push({
                id: chatId,
                title: chatTitle,
                topic_id: topicId,
                topic_name: topicName,
                added_at: new Date().toISOString()
            });

            await ctx.db.set('seit_bot_db', JSON.stringify(db));

            // 4. Respon Berhasil yang Estetik
            await ctx.reply(
                `╭───  <b>REGISTRATION SUCCESS</b>\n` +
                `│\n` +
                `├  📂 <b>Group:</b> <code>${chatTitle}</code>\n` +
                `├  🔖 <b>Topic:</b> <code>${topicName}</code>\n` +
                `├  🆔 <b>ID:</b> <code>${chatId}</code>\n` +
                `├  🛡️ <b>Status:</b> <code>Active</code>\n` +
                `│\n` +
                `╰─────── <i>SEIT System Synchronized</i>`,
                { parse_mode: 'HTML' }
            );

        } catch (error) {
            console.error('Register Error:', error);
            await ctx.reply("❌ <b>Gagal mendaftarkan grup.</b>", { parse_mode: 'HTML' });
        }
    }
};
