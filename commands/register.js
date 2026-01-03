module.exports = {
    name: 'register', // Ini yang dicari oleh index.js kamu
    execute: async (ctx) => {
        // Logika pendaftaran grup
        const chatId = ctx.chat.id;
        const chatTitle = ctx.chat.title;

        // Hanya izinkan di grup atau oleh owner
        if (ctx.chat.type === 'private' && ctx.from.id != ctx.ownerId) {
            return ctx.reply("❌ Command ini hanya untuk pendaftaran grup.");
        }

        try {
            // Ambil data DB dari Redis (ctx.db sudah diset di index.js)
            const rawDb = await ctx.db.get('seit_bot_db');
            let db = rawDb ? JSON.parse(rawDb) : { groups: [] };

            // Cek apakah grup sudah terdaftar
            const isExist = db.groups.find(g => g.id === chatId);
            if (isExist) {
                return ctx.reply("ℹ️ Grup ini sudah terdaftar dalam sistem broadcast.");
            }

            // Tambahkan grup baru
            // Jika grup punya topik (forum), simpan thread_id-nya
            const topicId = ctx.message.message_thread_id || null;
            
            db.groups.push({
                id: chatId,
                title: chatTitle,
                topic_id: topicId,
                added_at: new Date().toISOString()
            });

            // Simpan kembali ke Redis
            await ctx.db.set('seit_bot_db', JSON.stringify(db));

            await ctx.reply(
                `✅ <b>Berhasil Terdaftar!</b>\n` +
                `━━━━━━━━━━━━━━━\n` +
                `Grup: <b>${chatTitle}</b>\n` +
                `ID: <code>${chatId}</code>\n` +
                `Status: Aktif menerima broadcast.`,
                { parse_mode: 'HTML' }
            );

        } catch (error) {
            console.error('Register Error:', error);
            await ctx.reply("❌ Gagal mendaftarkan grup. Hubungi Owner.");
        }
    }
};
