const { IgApiClient } = require('instagram-private-api');

module.exports.loginInstagram = async () => {
    const ig = new IgApiClient();
    
    const username = process.env.INSTAGRAM_USERNAME;
    const password = process.env.INSTAGRAM_PASSWORD;

    // Proteksi jika variabel kosong
    if (!username || !password) {
        throw new Error("❌ Username atau Password IG di .env tidak ditemukan!");
    }

    // WAJIB: Gunakan username untuk generate device
    ig.state.generateDevice(username);

    try {
        console.log(`🚀 Mencoba login IG: ${username}...`);
        
        await ig.simulate.preLoginFlow();
        
        // Login menggunakan username dan password
        const loggedInUser = await ig.account.login(username, password);
        
        // Penting: Simulasi aktivitas setelah login agar tidak dianggap bot/spam
        process.nextTick(async () => await ig.simulate.postLoginFlow());
        
        console.log(`✅ Login Berhasil sebagai: ${loggedInUser.username}`);
        return ig;
    } catch (error) {
        // Jika error karena 'Instagram Not Found' biasanya karena username salah ketik
        if (error.message.includes('not found')) {
            console.error('❌ Error: Akun tidak ditemukan. Pastikan INSTAGRAM_USERNAME di .env sudah benar (gunakan username, bukan nomor HP).');
        } else if (error.message.includes('checkpoint')) {
            console.error('⚠️ Tantangan Keamanan: Buka aplikasi IG di HP, klik "Ini Saya" / "It was me", lalu restart bot.');
        } else {
            console.error('❌ Gagal Login Instagram:', error.message);
        }
        throw error;
    }
};
