module.exports = {
    name: 'start',
    execute: async (ctx) => {
        // Ganti dengan link invite grup SHARE EVENT I.T kamu
        const groupLink = 'https://t.me/share_event'; 

        const welcomeMessage = 
            `Halo *${ctx.from.first_name}*! 👋\n\n` +
            `Selamat datang di Bot *SHARE EVENT I.T*\.\n\n` +
            `Bot ini berfungsi untuk membantu kamu menyebarkan info event IT secara otomatis ke berbagai platform:\n\n` +
            `✅ *Grup Telegram Partner*\n` +
            `✅ *Channel Discord #info-event*\n` +
            `✅ *Feed Instagram*\n\n` +
            `Silakan klik tombol di bawah ini untuk bergabung ke grup utama dan mulai berbagi\!`;

        try {
            await ctx.replyWithMarkdown(welcomeMessage, {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '➕ Gabung Sekarang Juga', url: groupLink }
                        ]
                    ]
                }
            });
        } catch (error) {
            console.error('Gagal mengirim pesan start:', error.message);
        }
    }
};
