module.exports = async (ctx) => {
    // --- TAMBAHAN: Log Join/Kick & Auto Delete DB ---
    if (ctx.myChatMember) {
        const update = ctx.myChatMember;
        const chat = update.chat;
        const status = update.new_chat_member.status;

        if (status === 'administrator' || status === 'member') {
            const logJoin = `✅ <b>BOT TELAH DI JOIN</b>\n━━━━━━━━━━━━━━━\n📌 Grup: ${chat.title}\n🆔 ID: <code>${chat.id}</code>\n👤 Oleh: ${update.from.first_name}`;
            await ctx.telegram.sendMessage(ctx.ownerId, logJoin, { parse_mode: 'HTML' }).catch(() => {});
        }

        if (status === 'kicked' || status === 'left') {
            // Hapus dari DB
            let raw = await ctx.db.get('seit_bot_db');
            if (raw) {
                let db = JSON.parse(raw);
                db.groups = db.groups.filter(g => g.id !== chat.id);
                await ctx.db.set('seit_bot_db', JSON.stringify(db));
            }
            const logKick = `💢 <b>BOT TELAH DI KICK</b>\n━━━━━━━━━━━━━━━\n📌 Grup: ${chat.title}\n🆔 ID: <code>${chat.id}</code>\n👤 Oleh: ${update.from.first_name}\n\n⚠️ <i>Data grup dihapus dari database.</i>`;
            await ctx.telegram.sendMessage(ctx.ownerId, logKick, { parse_mode: 'HTML' }).catch(() => {});
        }
    }

    // --- STRUKTUR ASLI: Gatekeeper Fitur No. 4 & 5 ---
    const update = ctx.chatMember || ctx.myChatMember;
    const chat = ctx.chat;
    if (!chat || chat.title !== process.env.SOURCE_GROUP_NAME) return;

    if (update && update.new_chat_member.status === 'member') {
        const userId = update.new_chat_member.user.id;
        const isVerified = await ctx.db.get(`verify:${userId}`);

        if (!isVerified) {
            try {
                await ctx.banChatMember(userId);
                await ctx.unbanChatMember(userId);
                return ctx.telegram.sendMessage(userId, "⚠️ Akses Ditolak! Verifikasi di bot dulu.");
            } catch (e) { console.log(e.message); }
        } else {
            const guide = `<b>Selamat Datang!</b>\nKirim poster event kamu di sini.`;
            await ctx.telegram.sendMessage(userId, guide, { parse_mode: 'HTML' }).catch(() => {});
        }
    }
};
