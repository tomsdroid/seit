const moment = require('moment-timezone');

module.exports = async (ctx) => {
    // 1. SETTING WAKTU & ZONA
    const timezone = process.env.TIMEZONE || 'Asia/Jakarta';
    const now = moment().tz(timezone);
    const start = moment.tz("08:00", "HH:mm", timezone);
    const end = moment.tz("22:00", "HH:mm", timezone);

    // 2. CEK JAM OPERASIONAL
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

    // 3. CEK STATUS ADMIN (Wajib Admin agar fitur hapus pesan aktif)
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
            return console.error("Gagal verifikasi admin");
        }
    }

    // 4. LOGIKA PENDAFTARAN (Script Asli Disempurnakan)
    const chatId = ctx.chat.id;
    const chatTitle = ctx.chat.title || "Private Chat";
    
    // Ambil Nama Topik jika di dalam Forum
    const topicId = ctx.message.message_thread_id || null;
    const topicName = ctx.message.reply_to_message?.forum_topic_created?.name || "General / None";

    try {
        const rawDb = await ctx.db.get('seit_bot_db');
        let db = rawDb ? JSON.parse(rawDb) : { groups: [] };

        const isExist = db.groups.find(g => g.id === chatId);
        if (isExist) {
            return ctx.reply(`⚠️ <b>Grup ini sudah terdaftar sebelumnya.</b>`, { parse_mode: 'HTML' });
        }

        // Simpan Data
        db.groups.push({
            id: chatId,
            title: chatTitle,
            topic_id: topicId,
            topic_name: topicName,
            added_at: new Date().toISOString()
        });

        await ctx.db.set('seit_bot_db', JSON.stringify(db));

        // 5. RESPON ESTETIK
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
        await ctx.reply("❌ <b>Gagal mendaftarkan grup ke Database.</b>", { parse_mode: 'HTML' });
    }
};

// EXPORTS UNTUK AUTO-MAPPING
module.exports.name = 'register';
module.exports.execute = module.exports;
