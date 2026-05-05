require('dotenv').config();
const express = require('express');
const mqttConfig = require('./config/mqtt');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
app.use(express.json());

// Jalankan koneksi MQTT dan Automasi Sistem IoT[cite: 1]
mqttConfig.connect();

// Daftarkan rute API
app.use('/api', apiRoutes);

// Jalankan Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 [SERVER] Backend MushBox berjalan di port ${PORT}`);
});