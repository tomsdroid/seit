const moment = require('moment-timezone');

module.exports = {
    name: 'register',
    execute: async (ctx) => {
        // 1. Validasi Pengirim (Hanya Admin yang diproses)
        if (ctx.chat.type !== 'private') {
            try {
                const member = await ctx.getChatMember(ctx.from.id);
                const isAdmin = ['administrator', 'creator'].includes(member.status);
                
                // Tambahan: Owner (ID: 5803538088) selalu dianggap admin
                const isOwner = ctx.from.id === 5803538088;

                if (!isAdmin && !isOwner) {
                    // Jika bukan admin/owner, hapus pesan perintahnya dan abaikan
                    return ctx.deleteMessage().catch(() => {});
                }

                // 2. Cek Status Bot (Harus Admin untuk kelancaran sistem)
                const botMember = await ctx.getChatMember(ctx.botInfo.id);
                if (botMember.status !== 'administrator' && botMember.status !== 'creator') {
                    const denMsg = await ctx.reply(`⚠️ <b>Jadikan bot Admin terlebih dahulu!</b>`, { parse_mode: 'HTML' });
                    setTimeout(() => {
                        ctx.telegram.deleteMessage(ctx.chat.id, denMsg.message_id).catch(() => {});
                        ctx.deleteMessage().catch(() => {});
                    }, 3000);
                    return;
                }
            } catch (e) {
                console.error("Gagal verifikasi admin");
                return;
            }
        }

        // 3. Logika Penangkapan Data
        const chatId = ctx.chat.id;
        const chatTitle = ctx.chat.title || "Unknown Group";
        const topicId = ctx.message.message_thread_id || null;
        let topicName = "General / Non-Forum";

        try {
            if (topicId) {
                if (ctx.message.reply_to_message && ctx.message.reply_to_message.forum_topic_created) {
                    topicName = ctx.message.reply_to_message.forum_topic_created.name;
                } else {
                    topicName = `Topic #${topicId}`; 
                }
            }

            const rawDb = await ctx.db.get('seit_bot_db');
            let db = rawDb ? JSON.parse(rawDb) : { groups: [] };

            const isExist = db.groups.find(g => g.id === chatId && g.topic_id === topicId);
            if (isExist) {
                const existMsg = await ctx.reply(`⚠️ <b>Topik/Grup ini sudah terdaftar.</b>`, { parse_mode: 'HTML' });
                setTimeout(() => {
                    ctx.telegram.deleteMessage(ctx.chat.id, existMsg.message_id).catch(() => {});
                    ctx.deleteMessage().catch(() => {});
                }, 3000);
                return;
            }

            db.groups.push({
                id: chatId,
                name: chatTitle,
                topic_id: topicId,
                topic_name: topicName,
                added_at: new Date().toISOString()
            });

            await ctx.db.set('seit_bot_db', JSON.stringify(db));

            // 4. Respon Berhasil Estetik
            const successMsg = await ctx.reply(
                `╭───  <b>REGISTRATION SUCCESS</b>\n` +
                `│\n` +
                `├  📂 <b>Group:</b> <code>${chatTitle}</code>\n` +
                `├  🔖 <b>Topic:</b> <code>${topicName}</code>\n` +
                `├  🆔 <b>Thread:</b> <code>${topicId || 'N/A'}</code>\n` +
                `├  🛡️ <b>Status:</b> <code>Active</code>\n` +
                `│\n` +
                `╰─────── <i>SEIT System Synchronized</i>`,
                { parse_mode: 'HTML' }
            );

            // AUTO DELETE 3 DETIK
            setTimeout(() => {
                ctx.telegram.deleteMessage(ctx.chat.id, successMsg.message_id).catch(() => {});
                ctx.deleteMessage().catch(() => {});
            }, 3000);

        } catch (error) {
            console.error('Register Error:', error);
            const errMsg = await ctx.reply("❌ <b>Gagal mendaftarkan grup.</b>", { parse_mode: 'HTML' });
            setTimeout(() => {
                ctx.telegram.deleteMessage(ctx.chat.id, errMsg.message_id).catch(() => {});
                ctx.deleteMessage().catch(() => {});
            }, 3000);
        }
    }
};
