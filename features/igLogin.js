const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const path = require('path');

module.exports.loginInstagram = async () => {
    const ig = new IgApiClient();
    const sessionPath = path.join(__dirname, 'session.json');
    
    const username = process.env.INSTAGRAM_USERNAME;
    const password = process.env.INSTAGRAM_PASSWORD;

    if (!username || !password) {
        throw new Error("❌ Username atau Password IG di .env tidak ditemukan!");
    }

    ig.state.generateDevice(username);

    // --- FITUR BARU: CEK SESSION ---
    try {
        if (fs.existsSync(sessionPath)) {
            const savedSession = JSON.parse(fs.readFileSync(sessionPath));
            await ig.state.deserialize(savedSession);
            console.log(`♻️ Menggunakan session yang tersimpan untuk: ${username}`);
            
            // Verifikasi apakah session masih valid
            try {
                await ig.account.currentUser();
                console.log(`✅ Session masih aktif.`);
                return ig;
            } catch (e) {
                console.log(`⚠️ Session kadaluarsa, mencoba login ulang...`);
            }
        }

        // --- PROSES LOGIN NORMAL (Jika session tidak ada/kadaluarsa) ---
        console.log(`🚀 Mencoba login IG baru: ${username}...`);
        await ig.simulate.preLoginFlow();
        const loggedInUser = await ig.account.login(username, password);
        process.nextTick(async () => await ig.simulate.postLoginFlow());

        // --- SIMPAN SESSION SETELAH LOGIN BERHASIL ---
        const serialized = await ig.state.serialize();
        delete serialized.constants; // Opsional: bersihkan data konstan
        fs.writeFileSync(sessionPath, JSON.stringify(serialized));
        
        console.log(`✅ Login Berhasil & Session Disimpan: ${loggedInUser.username}`);
        return ig;

    } catch (error) {
        if (error.message.includes('checkpoint')) {
            console.error('⚠️ Tantangan Keamanan: Buka aplikasi IG di HP!');
        } else {
            console.error('❌ Gagal Login Instagram:', error.message);
        }
        throw error;
    }
};
