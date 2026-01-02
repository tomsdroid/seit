const express = require('express');
const path = require('path');
const app = express();

module.exports = (bot, redis) => {
    // Setting View Engine
    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, 'views'));
    
    // Serve Static Files (jika ada)
    app.use(express.static(path.join(__dirname, 'public')));

    app.get('/', async (req, res) => {
        try {
            // Ambil data grup
            const rawData = await redis.get('seit_bot_db');
            const db = rawData ? JSON.parse(rawData) : { groups: [] };
            
            // Render halaman dengan data
            res.render('index', { 
                groups: db.groups,
                totalGroups: db.groups.length,
                ownerId: process.env.OWNER_ID,
                botName: bot.botInfo?.username || "SEIT Bot"
            });
        } catch (err) {
            console.error("Dashboard Error:", err);
            res.status(500).send("Gagal memuat database Redis.");
        }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🌐 Dashboard SEIT Aktif: http://localhost:${PORT}`);
    });
};
