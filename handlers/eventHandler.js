const { WebhookClient, EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (ctx) => {
    // --- TAMBAHAN: Jam Operasional ---
    const now = moment().tz(process.env.TIMEZONE);
    const start = moment.tz(process.env.START_TIME, "HH:mm", process.env.TIMEZONE);
    const end = moment.tz(process.env.END_TIME, "HH:mm", process.env.TIMEZONE);

    if (now.isBefore(start) || now.isAfter(end)) {
        return ctx.reply("💤 <b>Bot sedang istirahat.</b>\nAbaikan semuanya, bot kembali beroperasi besok pagi.", { parse_mode: 'HTML' });
    }

    if (ctx.chat.title !== process.env.SOURCE_GROUP_NAME) return;
    if (!ctx.message.photo) return;

    const caption = ctx.message.caption || "";
    if (!caption.toLowerCase().includes("daftar sekarang") && !caption.toLowerCase().includes("link pendaftaran")) {
        return ctx.reply("⚠️ Caption harus ada keyword 'Daftar Sekarang'!");
    }

    try {
        const photoId = ctx.message.photo.pop().file_id;
        
        // TAMBAHAN: Get Image URL untuk Discord
        const fileLink = await ctx.telegram.getFileLink(photoId);
        const imageUrl = fileLink.href;

        const rawDb = await ctx.db.get('seit_bot_db');
        const db = rawDb ? JSON.parse(rawDb) : { groups: [] };

        let success = 0;
        let fail = 0;

        for (const group of db.groups) {
            try {
                await ctx.telegram.sendPhoto(group.id, photoId, {
                    caption: `<b>📢 INFO EVENT IT</b>\n\n${caption}`,
                    parse_mode: 'HTML',
                    message_thread_id: group.topic_id
                });
                success++;
            } catch (e) { fail++; }

            // Jeda 3-5 detik (Sesuai script awal)
            const waitTime = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
            await delay(waitTime);
        }

        // --- TAMBAHAN: Discord Embed dengan Foto ---
        const discord = new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL });
        const embed = new EmbedBuilder()
            .setTitle('📢 INFO EVENT I.T BARU')
            .setDescription(caption)
            .setColor('#0099ff')
            .setImage(imageUrl)
            .setTimestamp();
        
        await discord.send({ embeds: [embed] });

        // LOG KE OWNER
        const logMessage = 
            `📊 <b>LAPORAN BROADCAST</b>\n` +
            `━━━━━━━━━━━━━━━\n` +
            `✅ Sukses: <b>${success}</b> grup\n` +
            `❌ Gagal: <b>${fail}</b> grup\n` +
            `👤 Oleh: ${ctx.from.first_name}`;

        await ctx.telegram.sendMessage(ctx.ownerId, logMessage, { parse_mode: 'HTML' });
        ctx.reply("✅ Event berhasil di-broadcast!");

    } catch (err) {
        console.error("Broadcast Error:", err);
    }
};
