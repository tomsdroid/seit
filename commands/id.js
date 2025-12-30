module.exports = {
    name: 'id',
    execute: async (ctx) => {
        const chatId = ctx.chat.id;
        const chatTitle = ctx.chat.title || "Private Chat";
        const threadId = ctx.message.message_thread_id; // Ini akan mengambil ID Topik

        let response = `📌 **Informasi Chat**\n\n`;
        response += `👥 **Nama Grup:** ${chatTitle}\n`;
        response += `🆔 **ID Grup:** <code>${chatId}</code>\n`;
        
        if (threadId) {
            response += `内 **ID Topik (Thread):** <code>${threadId}</code>\n`;
            response += `\n*Gunakan ID Topik ini di fitur pengiriman spesifik.*`;
        } else {
            response += `\n_Chat ini tidak menggunakan topik atau Anda mengirim di topik General._`;
        }

        await ctx.reply(response, { parse_mode: 'HTML' });
    }
};
