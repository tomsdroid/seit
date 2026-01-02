module.exports.autoFormatCaption = (rawText) => {
    const cleanText = rawText.trim();
    return {
        tg: `<b>📢 INFO EVENT I.T</b>\n\n${cleanText}\n\n<i>Diteruskan oleh: SEIT Automation</i>`,
        ig: `📢 INFO EVENT I.T TERBARU\n\n${cleanText}\n\n.\n.\n#palembangpy #shareeventit #eventit #programming`
    };
};
