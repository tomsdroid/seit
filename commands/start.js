const { Markup } = require('telegraf');

module.exports = {
    name: 'start',
    execute: async (ctx) => {
        const userId = ctx.from.id;
        
        // Simpan verifikasi ke Redis (Berlaku 7 hari)
        await ctx.db.set(`verify:${userId}`, 'true', 'EX', 604800); 

        // Respon dengan Tombol Gabung
        await ctx.replyWithHTML(
            `Halo <b>${ctx.from.first_name}</b>! 👋\n\n` +
            `Verifikasi berhasil. Silakan tekan tombol di bawah ini untuk masuk ke grup utama dan mulai membagikan info event IT terbaru.`,
            Markup.inlineKeyboard([
                [Markup.button.url('🚀 Gabung Sekarang', 'https://t.me/share_event')]
            ])
        );
    }
};
