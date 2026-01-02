const { WebhookClient, EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const axios = require('axios');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Menggunakan resource login yang sudah ada sesuai strukturmu
const { loginInstagram } = require('../features/igLogin');

module.exports = async (ctx) => {
    // 1. Jam Operasional
    const now = moment().tz(process.env.TIMEZONE);
    const start = moment.tz(process.env.START_TIME, "HH:mm", process.env.TIMEZONE);
    const end = moment.tz(process.env.END_TIME, "HH:mm", process.env.TIMEZONE);

    if (now.isBefore(start) || now.isAfter(end)) {
        return ctx.reply("💤 <b>Bot sedang istirahat.</b>\nAbaikan semuanya, bot kembali beroperasi besok pagi.", { parse_mode: 'HTML' });
    }

    if (ctx.chat.title !== process.env.SOURCE_GROUP_NAME || !ctx.message.photo) return;

    const caption = ctx.message.caption || "";
    if (!caption.toLowerCase().includes("daftar sekarang") && !caption.toLowerCase().includes("link pendaftaran")) {
        return ctx.reply("⚠️ Caption wajib ada 'Daftar Sekarang'!");
    }

    try {
        const photoId = ctx.message.photo.pop().file_id;
        const fileLink = await ctx.telegram.getFileLink(photoId);
        const imageUrl = fileLink.href;

        const rawDb = await ctx.db.get('seit_bot_db');
        const db = rawDb ? JSON.parse(rawDb) : { groups: [] };
        let success = 0; let fail = 0;

        // --- A. BROADCAST TELEGRAM ---
        for (const group of db.groups) {
            try {
                await ctx.telegram.sendPhoto(group.id, photoId, {
                    caption: `<b>📢 INFO EVENT IT</b>\n\n${caption}`,
                    parse_mode: 'HTML',
                    message_thread_id: group.topic_id
                });
                success++;
            } catch (e) { fail++; }
            await delay(Math.floor(Math.random() * 2000) + 3000);
        }

        // --- B. BROADCAST DISCORD ---
        const discord = new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL });
        const embed = new EmbedBuilder()
            .setTitle('📢 INFO EVENT I.T BARU')
            .setDescription(caption)
            .setColor('#0099ff')
            .setImage(imageUrl)
            .setTimestamp();
        await discord.send({ embeds: [embed] }).catch(() => {});

        // --- C. UPLOAD INSTAGRAM (Menggunakan Features/igLogin) ---
        let igStatus = "Pending";
        try {
            // Memanggil fungsi login dari features
            const ig = await loginInstagram();

            // Download gambar ke Buffer menggunakan axios (sesuai package.json)
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');

            // Publish ke Instagram Feed
            await ig.publish.photo({
                file: imageBuffer,
                caption: caption,
            });
            igStatus = "✅ Terbit";
        } catch (e) {
            igStatus = "❌ Gagal: " + e.message;
        }

        // --- D. LAPORAN KE OWNER ---
        const report = 
            `📊 <b>LAPORAN BROADCAST SEIT</b>\n` +
            `━━━━━━━━━━━━━━━\n` +
            `✅ Telegram: <b>${success}</b> Grup\n` +
            `✅ Discord: <b>Terkirim</b>\n` +
            `📸 Instagram: <b>${igStatus}</b>\n` +
            `━━━━━━━━━━━━━━━\n` +
            `👤 Oleh: ${ctx.from.first_name}`;

        await ctx.telegram.sendMessage(ctx.ownerId, report, { parse_mode: 'HTML' });

    } catch (err) {
        console.error("Master Error:", err.message);
    }
};
