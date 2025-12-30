const { IgApiClient } = require('instagram-private-api');
const fs = require('fs');
const path = require('path');

const ig = new IgApiClient();
const sessionPath = path.join(__dirname, '../session.json');

async function loginInstagram() {
    ig.state.generateDevice(process.env.IG_USERNAME);

    // Cek apakah ada sesi yang tersimpan
    if (fs.existsSync(sessionPath)) {
        const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf-8'));
        await ig.state.importSettings(sessionData);
        console.log('🔄 Menggunakan sesi Instagram yang ada...');
    }

    try {
        // Coba login (jika sesi mati, dia akan login ulang otomatis)
        const loggedInUser = await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
        
        // Simpan sesi setelah login sukses
        const serialized = await ig.state.serialize();
        delete serialized.constants; // Bersihkan data yang tidak perlu
        fs.writeFileSync(sessionPath, JSON.stringify(serialized));
        
        console.log(`✅ Instagram Login Berhasil sebagai: ${loggedInUser.username}`);
        return ig;
    } catch (err) {
        console.error('❌ Gagal Login Instagram:', err.message);
        throw err;
    }
}

module.exports = loginInstagram;
