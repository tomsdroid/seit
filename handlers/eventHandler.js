const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Jimp } = require('jimp'); 
const fs = require('fs');
const path = require('path');
const { autoFormatCaption } = require('../utils/formatter');

/**
 * Fungsi untuk update file .env secara otomatis (Target Group & Topic)
 * Menyimpan dalam format ChatID atau ChatID:ThreadID
 */
function updateEnvId(chatId, threadId) {
    try {
        const envPath = path.join(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        const entry = threadId ? `${chatId}:${threadId}` : `${chatId}`;
        const match = envContent.match(/TARGET_GROUPS=(.*)/);
        let currentIds = match && match[1] ? match[1].split(',') : [];

        if (!currentIds.includes(entry)) {
            currentIds.push(entry);
            const newConfig = `TARGET_GROUPS=${currentIds.join(',')}`;
            
            if (match) {
                envContent = envContent.replace(/TARGET_GROUPS=.*/, newConfig);
            } else {
                envContent += `\n${newConfig}`;
            }

            fs.writeFileSync(envPath, envContent);
            console.log(`✅ [ENV UPDATED] Target Baru Tersimpan: ${entry}`);
            process.env.TARGET_GROUPS = currentIds.join(',');
        }
    } catch (err) {
        console.error('❌ Gagal update file .env:', err.message);
    }
}

module.exports = async (ctx, ig, discordWebhook) => {
    const chat = ctx.chat;
    const threadId = ctx.message?.message_thread_id;

    // --- 1. AUTO-SAVE ID GRUP & TOPIK ---
    // Menyimpan ID grup tujuan selain grup sumber utama
    if ((chat.type === 'group' || chat.type === 'supergroup') && chat.title !== process.env.SOURCE_GROUP_NAME) {
        if (chat.type === 'supergroup' && threadId) {
            updateEnvId(chat.id, threadId);
        } else if (chat.type === 'group') {
            updateEnvId(chat.id, null);
        }
    }

    // --- 2. FILTER SUMBER & VALIDASI KONTEN ---
    if (chat.title !== process.env.SOURCE_GROUP_NAME) return;
    if (!ctx.message.photo) return;

    const rawCaption = ctx.message.caption || "";

    // Validasi Kata Kunci Wajib
    const requiredKeywords = ["Daftar Sekarang", "Link Pendaftaran"];
    const hasKeyword = requiredKeywords.some(keyword => 
        rawCaption.toLowerCase().includes(keyword.toLowerCase())
    );

    if (!hasKeyword) {
        return ctx.reply("⚠️ <b>Gagal Posting!</b>\nCaption wajib mengandung kata <i>'Daftar Sekarang'</i> atau <i>'Link Pendaftaran'</i>.", { parse_mode: 'HTML' });
    }

    // Ekstraksi Link Pertama dari Caption (Regex)
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const foundLinks = rawCaption.match(urlRegex);
    // Jika link tidak ditemukan, arahkan ke Instagram sebagai fallback
    const targetLink = foundLinks ? foundLinks[0] : 'https://www.instagram.com/shareevent.it';

    const { tg, ig: igCaption } = autoFormatCaption(rawCaption);
    const photoId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
    const outputPath = path.join(__dirname, `../ready_${photoId}.jpg`);

    try {
        console.log('🔄 Memproses Event I.T (Multi-Platform)...');

        // --- 3. PROSES GAMBAR (JIMP) ---
        const link = await ctx.telegram.getFileLink(photoId);
        const image = await Jimp.read(link.href);
        
        // Resize Square 1080x1080 untuk Instagram & Discord
        await image.cover({ w: 1080, h: 1080 });
        await image.write(outputPath);

        // --- 4. SIAPKAN KOMPONEN DISCORD (WEBHOOK) ---
        const file = new AttachmentBuilder(outputPath, { name: 'event.jpg' });
        
        // Tombol Link Dinamis
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Daftar Sekarang')
                .setStyle(ButtonStyle.Link)
                .setURL(targetLink)
        );

        const embed = new EmbedBuilder()
            .setTitle('📢 SAHRE EVENT I.T TERBARU')
            .setURL(targetLink) // Judul Embed bisa diklik
            .setDescription(rawCaption)
            .setColor(0x0099ff)
            .setImage('attachment://event.jpg')
            .setFooter({ text: 'S.E.I.T Automation Bot' })
            .setTimestamp();

        // --- 5. EKSEKUSI PENGIRIMAN ---
        const targetEntries = process.env.TARGET_GROUPS ? process.env.TARGET_GROUPS.split(',') : [];
        const tasks = [];

        // Task A: Kirim ke Semua Target Grup Telegram
        targetEntries.forEach(entry => {
            const [tChatId, tThreadId] = entry.split(':');
            tasks.push(
                ctx.telegram.sendPhoto(tChatId.trim(), photoId, {
                    caption: tg,
                    parse_mode: 'HTML',
                    message_thread_id: tThreadId ? parseInt(tThreadId) : undefined
                })
            );
        });

        // Task B: Kirim ke Discord Webhook (Embed + File + Button)
        tasks.push(discordWebhook.send({
            embeds: [embed],
            files: [file],
            components: [row]
        }));

        // Task C: Kirim ke Instagram
        tasks.push(ig.publish.photo({
            file: fs.readFileSync(outputPath),
            caption: igCaption
        }));

        // Jalankan semua task secara paralel
        await Promise.all(tasks);

        // --- 6. NOTIFIKASI SUKSES ---
        ctx.reply('✅ <b>Event Berhasil Terverifikasi & Diposting!</b>', { 
            parse_mode: 'HTML',
            reply_to_message_id: ctx.message.message_id,
            reply_markup: {
                inline_keyboard: [
                    [{ text: '➕ Lihat & Ikuti Instagram Kami', url: 'https://www.instagram.com/shareevent.it' }]
                ]
            }
        });

    } catch (error) {
        console.error('❌ [EVENT HANDLER ERROR]:', error.message);
        ctx.reply(`❌ Gagal memproses event: ${error.message}`);
    } finally {
        // Hapus file sementara agar tidak memenuhi penyimpanan Termux
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    }
};
