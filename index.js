require('dotenv').config();
const express = require('express');
const mqttConfig = require('./config/mqtt');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.use(express.json());

// Jalankan koneksi MQTT dan Automasi Sistem IoT
mqttConfig.connect();

// ====================================================
// --- TAMBAHAN: RUTE HALAMAN UTAMA (WEB BROWSER) ---
// ====================================================
app.get('/', (req, res) => {
    res.json({
        app: "MushBox Backend System",
        status: "Online 🟢",
        waktu_server: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        // Meminta data terbaru dari file mqtt.js
        data_terkini: mqttConfig.getLatestData ? mqttConfig.getLatestData() : { pesan: "Menunggu data dari ESP32..." }
    });
});

// Daftarkan rute API
app.use('/api', apiRoutes);

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 [SERVER] Backend MushBox berjalan di port ${PORT}`);
});