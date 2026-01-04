const { WebhookClient, EmbedBuilder } = require('discord.js');
const moment = require('moment-timezone');
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = async (ctx) => {
    // 1. Filter Sumber & Media
    if (ctx.chat.title !== process.env.SOURCE_GROUP_NAME || !ctx.message.photo) return;

    const caption = ctx.message.caption || "";
    
    // Filter Caption
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

        const rawDb = await ctx.db.get('seit_bot_db');
        const db = rawDb ? JSON.parse(rawDb) : { groups: [] };
        let success = 0;

        // --- A. BROADCAST TELEGRAM ---
        for (const group of db.groups) {
            try {
                await ctx.telegram.sendPhoto(group.id, photoId, {
                    caption: `<b>📢 INFO EVENT IT</b>\n\n${caption}`,
                    parse_mode: 'HTML',
                    message_thread_id: group.topic_id
                });
                success++;
            } catch (e) { /* silent fail */ }
            
            // Antrian delay agar tidak terkena limit rate Telegram
            await delay(Math.floor(Math.random() * 2000) + 3000);
        }

        // --- B. BROADCAST DISCORD ---
        const discord = new WebhookClient({ url: process.env.DISCORD_WEBHOOK_URL });
        const embed = new EmbedBuilder()
            .setTitle('📢 INFO EVENT I.T')
            .setDescription(caption)
            .setColor('#0099ff')
            .setImage(imageUrl)
            .setTimestamp();

        await discord.send({ embeds: [embed] }).catch(() => {});

        // --- C. LAPORAN KE OWNER ---
        const report = 
            `╔════════════════════╗\n` +
            `║   📊 <b>SEIT SYSTEM LOG</b>      ║\n` +
            `╚════════════════════╝\n\n` +
            `◈ <b>Channel Terdaftar</b>\n` +
            `┝ 📱 Telegram : <code>${success} Nodes</code>\n` +
            `┝ 💬 Discord  : <code>Success</code>\n` +
            `┕ 📸 Instagram: <code>Disabled</code>\n\n` +
            `◈ <b>Meta Data</b>\n` +
            `┝ 👤 Author   : <code>${ctx.from.first_name}</code>\n` +
            `┕ ⏰ Time     : <code>${moment().tz("Asia/Jakarta").format('HH:mm:ss')} WIB</code>\n\n` +
            `<i>-- SEIT Broadcast System --</i>`;

        await ctx.telegram.sendMessage(ctx.ownerId, report, { 
            parse_mode: 'HTML', 
            disable_web_page_preview: true 
        });

    } catch (err) {
        console.error("Master Error:", err.message);
    }
};
