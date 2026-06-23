const mqtt = require('mqtt');
const { handleSensorData } = require('../controllers/sensorController');
const { initScheduling } = require('../services/scheduleService');

const SENSOR_TOPIC = 'mewing/sensor/data';
let mqttClient = null;

// ====================================================
// 1. BUAT WADAH PENYIMPAN DATA
// ====================================================
let dataSensorTerakhir = { status: "Menunggu data masuk dari ESP32..." };

function connect() {
    mqttClient = mqtt.connect(process.env.MQTT_BROKER, {
        username: process.env.MQTT_USER,
        password: process.env.MQTT_PASSWORD,
        protocol: 'mqtts' // Menggunakan jalur aman SSL
    });

    mqttClient.on('connect', () => {
        console.log('✅ [MQTT] Terhubung ke Broker HiveMQ');
        mqttClient.subscribe(SENSOR_TOPIC);
        
        // Mulai jalankan sistem penjadwalan
        initScheduling(mqttClient); 
    });

    mqttClient.on('message', (topic, message) => {
        if (topic === SENSOR_TOPIC) {
            
            // ====================================================
            // 2. SIMPAN DATA SAAT PESAN MASUK
            // ====================================================
            try {
                dataSensorTerakhir = JSON.parse(message.toString());
            } catch (error) {
                console.error("❌ Gagal membaca format JSON dari MQTT:", error.message);
            }

            // Jika ada pesan masuk, lempar ke Controller
            handleSensorData(message, mqttClient);
        }
    });
}

// ====================================================
// 3. BAGIKAN WADAH KE FILE LAIN (INDEX.JS)
// ====================================================
module.exports = { 
    connect,
    getLatestData: () => dataSensorTerakhir 
};