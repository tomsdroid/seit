module.exports = {
    name: 'guidline',
    execute: async (ctx) => {
        const pesan = `<b>📖 PANDUAN POSTING EVENT</b>\n\n` +
            `1. <b>Kirim Foto</b> (Poster Event).\n` +
            `2. <b>Caption</b> wajib mengandung kata "Daftar Sekarang" atau "Link Pendaftaran".\n` +
            `3. <b>Link</b> pendaftaran harus disertakan.\n\n` +
            `✅ Postingan akan otomatis masuk ke:\n` +
            `📱 Instagram: @shareevent.it\n` +
            `💬 Discord & Grup Rekanan.`;
        
        await ctx.reply(pesan, { parse_mode: 'HTML' });
    }
};
