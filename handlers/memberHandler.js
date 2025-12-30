module.exports = async (ctx) => {
    try {
        // 1. Ambil data member dari berbagai kemungkinan event (chat_member atau new_chat_members)
        const update = ctx.chatMember || ctx.myChatMember;
        const newMembersFromMsg = ctx.message?.new_chat_members;

        let targetUser = null;

        // Kondisi A: Event berasal dari update status (chat_member)
        if (update && update.new_chat_member) {
            // Hanya proses jika statusnya adalah 'member' (baru gabung)
            if (update.new_chat_member.status === 'member') {
                targetUser = update.new_chat_member.user;
            }
        } 
        // Kondisi B: Event berasal dari pesan sistem (new_chat_members)
        else if (newMembersFromMsg && newMembersFromMsg.length > 0) {
            targetUser = newMembersFromMsg[0];
        }

        // 2. Validasi: Jika tidak ada user atau yang gabung adalah Bot, abaikan
        if (!targetUser || targetUser.is_bot) return;

        // 3. Validasi Nama Grup: Pastikan berasal dari grup sumber di .env
        const chatTitle = ctx.chat?.title;
        if (chatTitle !== process.env.SOURCE_GROUP_NAME) return;

        const userId = targetUser.id;
        const firstName = targetUser.first_name;

        // 4. Siapkan Pesan Tutorial
        const tutorialMessage = `<b>Selamat Datang di Share Event I.T!</b> 🚀

Agar event kamu otomatis terposting ke <b>Instagram, Discord, dan Grup Rekanan</b>, silakan ikuti panduan berikut:

<b>Cara Posting Event:</b>
1️⃣ <b>Kirim Foto</b> poster event (Gunakan rasio 1:1 agar hasil maksimal).
2️⃣ <b>Isi Caption</b> dengan detail lengkap.
3️⃣ <b>Wajib Ada Kata Kunci:</b> Sertakan kata <i>"Daftar Sekarang"</i> atau <i>"Link Pendaftaran"</i> di dalam caption.
4️⃣ <b>Sertakan Link:</b> Pastikan ada link pendaftaran (Contoh: https://link.com).

<b>Contoh:</b>
<blockquote>Webinar AI 2024
Daftar Sekarang di: https://bit.ly/daftar-ai</blockquote>

<i>Bot akan menolak postingan jika syarat di atas tidak terpenuhi.</i>`;


        // 5. Kirim DM
        await ctx.telegram.sendMessage(userId, tutorialMessage, { 
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [
                        { 
                            text: '👤 Hubungi Admin!', 
                            url: 'https://t.me/tomsdroid007' 
                        }
                    ]
                ]
            }
        });

        console.log(`✅ [DM SENT] Berhasil mengirim tutorial ke ${firstName}`);

    } catch (err) {
        // Jika error 403 (Forbidden), berarti user belum menekan /start di bot
        if (err.response?.error_code === 403) {
            console.log(`⚠️ [DM FAILED] ${ctx.from?.first_name} belum memulai bot.`);
        } else {
            console.error("❌ [HANDLER ERROR]:", err.message);
        }
    }
};
