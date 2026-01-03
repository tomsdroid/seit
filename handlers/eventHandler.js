const { WebhookClient, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Markup } = require('telegraf'); // Untuk tombol Telegram
const moment = require('moment-timezone');
const axios = require('axios');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const { loginInstagram } = require('../features/igLogin');

module.exports = async (ctx) => {
    if (ctx.chat.title !== process.env.SOURCE_GROUP_NAME || !ctx.message.photo) return;

    const caption = ctx.message.caption || "";
    
    if (!caption.toLowerCase().includes("daftar sekarang") && !caption.toLowerCase().includes("link pendaftaran")) {
        const msg = await ctx.reply("⚠️ <b>Caption wajib mengandung 'Daftar Sekarang'!</b>", { parse_mode: 'HTML' });
        setTimeout(() => {
            ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});
            ctx.deleteMessage().catch(() => {});
        }, 3000);
        return;
    }

    try {
        const photoId = ctx.message.photo.pop().file_id;
        const fileLink = await ctx.telegram.getFileLink(photoId);
        const imageUrl = fileLink.href;

        // --- 1. UPLOAD INSTAGRAM DULU (Untuk ambil Link Asli) ---
        let igStatus = "❌ GAGAL PUBLISH";
        let postUrl = "https://instagram.com/shareeventit"; // Fallback ke profil

        try {
            const ig = await loginInstagram();
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const imageBuffer = Buffer.from(response.data, 'binary');

            const publishResult = await ig.publish.photo({
                file: imageBuffer,
                caption: caption,
            });

            // Menangkap shortcode untuk membuat link asli postingan
            if (publishResult.media && publishResult.media.code) {
                postUrl = `https://www.instagram.com/p/${publishResult.media.code}/`;
                igStatus = "✅ SUCCESS PUBLISH";
            }
        } catch (e) {
            console.error("IG Error:", e.message);
        }

        const rawDb = await ctx.db.get('seit_bot_db');
        const db = rawDb ? JSON.parse(rawDb) : { groups: [] };
        let success = 0;

        // --- 2. BROADCAST TELEGRAM (Dengan Tombol Link Asli IG) ---
        const inlineKeyboard = Markup.inlineKeyboard([
            [Markup.button.url('📸 Lihat Postingan', postUrl)]
        ]);

        for (const group of db.groups) {
            try {
                await ctx.telegram.sendPhoto(group.id, photoId, {
                    caption: `<b>📢 INFO EVENT IT</b>\n\n${caption}`,
                    parse_mode: 'HTML',
                    message_thread_id: group.topic_id,
                    ...inlineKeyboard
                });
                success++;
            } catch (e) { /* fail silent */ }
            await delay(Math.floor(Math.random() * 2000) + 3000);
        }

        // --- 3. BROADCAST DISCORD (Dengan URL Link Asli IG) ---
        const discord = new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL });
        const embed = new EmbedBuilder()
            .setTitle('📢 INFO EVENT I.T')
            .setURL(postUrl) // Klik judul langsung ke postingan IG
            .setDescription(caption)
            .setColor('#0099ff')
            .setImage(imageUrl)
            .setFooter({ text: 'Klik judul untuk melihat postingan Instagram' })
            .setTimestamp();

        await discord.send({ embeds: [embed] }).catch(() => {});

        // --- 4. LAPORAN KE OWNER ---
        const report = 
            `╔════════════════════╗\n` +
            `║   📊 <b>SEIT SYSTEM LOG</b>      ║\n` +
            `╚════════════════════╝\n\n` +
            `◈ <b>Channel Terdaftar</b>\n` +
            `┝ 📱 Telegram : <code>${success} Nodes</code>\n` +
            `┝ 💬 Discord  : <code>Delivered</code>\n` +
            `┕ 📸 Instagram: <code>${igStatus}</code>\n\n` +
            `◈ <b>Link Postingan</b>\n` +
            `┕ 🔗 <code>${postUrl}</code>\n\n` +
            `<i>-- SEIT Broadcast System --</i>`;

        await ctx.telegram.sendMessage(ctx.ownerId, report, { parse_mode: 'HTML', disable_web_page_preview: true });

    } catch (err) {
        console.error("Master Error:", err.message);
    }
};
