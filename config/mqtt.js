const mqtt = require('mqtt');
const { handleSensorData } = require('../controllers/sensorController');

const SENSOR_TOPIC = 'mewing/sensor/data';
let mqttClient = null;

function connect() {
    mqttClient = mqtt.connect(process.env.MQTT_BROKER, {
        username: process.env.MQTT_USER,
        password: process.env.MQTT_PASSWORD,
        protocol: 'mqtts' // Menggunakan jalur aman SSL
    });

    mqttClient.on('connect', () => {
        console.log('✅ [MQTT] Terhubung ke Broker HiveMQ');
        mqttClient.subscribe(SENSOR_TOPIC); // Mendengarkan data sensor
    });

    mqttClient.on('message', (topic, message) => {
        if (topic === SENSOR_TOPIC) {
            // Jika ada pesan masuk, lempar ke Controller
            handleSensorData(message, mqttClient);
        }
    });
}

module.exports = { connect };