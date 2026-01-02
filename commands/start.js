module.exports = {
    name: 'start',
    execute: async (ctx) => {
        const userId = ctx.from.id;
        // Simpan verifikasi ke Redis
        await ctx.db.set(`verify:${userId}`, 'true', 'EX', 604800); // 7 hari

        await ctx.replyWithHTML(
            `Halo <b>${ctx.from.first_name}</b>! 👋\n\n` +
            `Verifikasi berhasil. Silakan masuk ke grup utama:\n` +
            `👉 <a href="https://t.me/share_event">Grup SHARE EVENT I.T</a>`
        );
    }
};
