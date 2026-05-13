const supabase = require('../config/supabase');

// Pisahkan topik MQTT
const TOPICS = {
    'Pompa': 'mewing/relay/pump',
    'Kipas': 'mewing/relay/fan'
};

async function checkAndTriggerIrrigation(sensorData, mqttClient) {
    try {
        // 1. Ambil semua aturan
        const { data: triggers, error } = await supabase
            .from('otomasi_trigger')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        // 2. Iterasi aturan
        for (const rule of triggers) {
            let isConditionMet = false;
            const currentVal = getSensorValue(rule.sensor, sensorData);

            if (rule.operator === '<') isConditionMet = currentVal < rule.nilai;
            else if (rule.operator === '>') isConditionMet = currentVal > rule.nilai;
            else if (rule.operator === '=') isConditionMet = currentVal == rule.nilai;

            if (isConditionMet) {
                console.log(`🎯 [OTOMASI] Aturan Terpenuhi: ${rule.sensor} ${rule.operator} ${rule.nilai}`);
                
                // BERSIHKAN SPASI SILUMAN DARI DATABASE
                const aktuatorBersih = rule.aktuator.trim();
                const perintahBersih = rule.perintah.trim();
                const targetTopic = TOPICS[aktuatorBersih];

                // CEK DAN TEMBAKKAN PESAN
                if (targetTopic) {
                    console.log(`📡 [PUBLISH] Node.js menembakkan -> Topik: [${targetTopic}], Perintah: [${perintahBersih}]`);
                    
                    // Eksekusi tembakan ke HiveMQ
                    mqttClient.publish(targetTopic, perintahBersih, (err) => {
                        if (err) console.error(`❌ Gagal kirim ke MQTT:`, err);
                    });
                } else {
                    console.log(`⚠️ [WARNING] Aktuator '${aktuatorBersih}' tidak ditemukan di daftar TOPICS Node.js!`);
                }
            }
        }
    } catch (err) {
        console.error('❌ Error Automation Service:', err.message);
    }
}

function getSensorValue(sensorName, data) {
    if (sensorName === 'Suhu') return data.temp;
    if (sensorName === 'Kelembaban Tanah') return data.soil;
    if (sensorName === 'Kelembaban Udara') return data.hum;
    if (sensorName === 'Level Air') return data.dist;
    if (sensorName === 'CO2') return data.co2;
    return 0;
}

module.exports = { checkAndTriggerIrrigation };