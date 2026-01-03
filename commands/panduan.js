const { Markup } = require('telegraf');

module.exports = {
    name: 'panduan',
    execute: async (ctx) => {
        const dashboardUrl = process.env.DASHBOARD_URL || 'https://palembangpy.koyeb.app';
        
        const text = `📖 *PANDUAN ADMIN & PENGGUNAAN BOT*\n\n` +
            `🛡️ *KHUSUS ADMIN GRUP:*\n` +
            `1. *Tambahkan Bot*: Masukkan bot ke grup & jadikan Admin.\n` +
            `2. *Pilih Topik*: Masuk ke topik/thread tujuan (jika ada).\n` +
            `3. *Pendaftaran*: Ketik \`/register\` di topik tersebut.\n\n` +
            `🚀 *SISTEM BROADCAST:*\n` +
            `• Event otomatis diteruskan ke semua grup terdaftar.\n` +
            `• Member biasa tidak bisa menggunakan perintah bot.\n\n` +
            `📊 *MONITORING:* Anda bisa memantau grup di dashboard resmi.`;

        try {
            // Mengirim pesan langsung ke DM (Private Chat) user
            await ctx.telegram.sendMessage(ctx.from.id, text, {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    [Markup.button.url('Buka Dashboard 🖥️', dashboardUrl)]
                ])
            });

            // Jika perintah diketik di grup, berikan notifikasi kecil agar user cek DM
            if (ctx.chat.type !== 'private') {
                await ctx.reply(`✅ Halo ${ctx.from.first_name}, panduan lengkap sudah saya kirimkan ke chat pribadi (DM) ya!`);
            }
        } catch (error) {
            console.error('Gagal kirim DM:', error);
            // Jika user belum pernah start bot, bot tidak bisa kirim DM duluan
            if (ctx.chat.type !== 'private') {
                await ctx.reply('❌ Saya tidak bisa mengirimkan DM. Silakan chat saya dulu (klik tombol Start) baru ulangi perintah /panduan.');
            }
        }
    }
};
