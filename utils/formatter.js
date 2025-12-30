module.exports = {
    autoFormatCaption: (rawText) => {
        if (!rawText) return { tg: "<b>🚀 NEW EVENT I.T</b>", ig: "🚀 NEW EVENT I.T" };
        
        const lines = rawText.split('\n');
        const title = lines[0].toUpperCase();
        const body = lines.slice(1).join('\n');

        return {
            tg: `<b>🚀 ${title}</b>\n\n${body}\n\n#EventIT #ShareEventIT`,
            ig: `🚀 ${title}\n\n${body}\n\n.\n#EventIT #TechEvent`
        };
    }
};
