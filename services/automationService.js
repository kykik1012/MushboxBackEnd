const supabase = require('../config/supabase');

const RELAY_TOPIC = 'mewing/relay/control';

async function checkAndTriggerIrrigation(data, mqttClient) {
    // Logika Otomasi: Jika kelembapan tanah di bawah 40%
    if (data.soil < 40) {
        console.log('🌱 [AUTOMATION] Tanah kering (< 40%). Menyalakan Mist Irrigation!');
        
        // 1. Perintahkan Aktuator Pompa Air (ESP32) untuk menyala[cite: 1]
        // Pastikan ESP32 kamu sudah diprogram untuk membaca topik RELAY_TOPIC
        mqttClient.publish(RELAY_TOPIC, JSON.stringify({ relay_status: 'Online' }));

        // 2. Catat ke tabel history penyemprotan di Supabase[cite: 1]
        const { error } = await supabase
            .from('sprinkler_history')
            .insert([{ action_type: 'Trigger Otomatis - Soil < 40%' }]);
        
        if (error) console.error('❌ Gagal mencatat history penyemprotan:', error);
    }
}

module.exports = { checkAndTriggerIrrigation };