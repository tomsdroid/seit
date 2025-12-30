module.exports = {
    name: 'about',
    execute: async (ctx) => {
        const aboutMessage = 
            `<b>🤖 EVENT I.T AUTOMATION BOT</b>\n\n` +
            `Bot ini dikembangkan khusus untuk mengotomasi penyebaran informasi event IT dari grup <b>SHARE EVENT I.T</b> ke berbagai platform secara real-time.\n\n` +
            `<i>Dikembangkan untuk mempermudah komunitas IT berbagi ilmu.</i>\n\n<code>powered by: @palembangpy</code>`;

        try {
            await ctx.reply(aboutMessage, {
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '🌐 Cek Instagram & Follow', url: `https://instagram.com/${process.env.IG_USERNAME_LINK}` }
                        ]
                    ]
                }
            });
        } catch (error) {
            console.error('Gagal mengirim pesan about:', error.message);
        }
    }
};
