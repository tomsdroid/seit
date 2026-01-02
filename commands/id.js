module.exports = {
    name: 'id',
    execute: async (ctx) => {
        const chatId = ctx.chat.id;
        const threadId = ctx.message?.message_thread_id;
        const userId = ctx.from.id;

        let response = `<b>🆔 INFO ID</b>\n\n`;
        response += `👤 <b>User ID:</b> <code>${userId}</code>\n`;
        response += `📍 <b>Chat ID:</b> <code>${chatId}</code>\n`;
        
        if (threadId) {
            response += `🧵 <b>Topic ID:</b> <code>${threadId}</code>\n`;
        }

        await ctx.reply(response, { parse_mode: 'HTML' });
    }
};
