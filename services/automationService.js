const supabase = require('../config/supabase');

const TOPICS = {
    'Pompa': 'mewing/relay/pump',
    'Kipas': 'mewing/relay/fan'
};

async function checkAndTriggerIrrigation(sensorData, mqttClient) {
    try {
        const { data: triggers, error } = await supabase
            .from('otomasi_trigger')
            .select('*')
            .eq('is_active', true);

        if (error) throw error;

        for (const rule of triggers) {
            const currentVal = getSensorValue(rule.sensor, sensorData);
            const aktuatorBersih = rule.aktuator.trim();
            const perintahBersih = rule.perintah.trim(); // Biasanya 'ON'
            const targetTopic = TOPICS[aktuatorBersih];
            
            // Ambil status alat saat ini dari ESP32 (agar tidak spam)
            const currentState = aktuatorBersih === 'Pompa' ? sensorData.pump : sensorData.fan;

            if (targetTopic) {
                // ====================================================
                // 1. LOGIKA BARU: BATAS ATAS & BATAS BAWAH (HYSTERESIS)
                // ====================================================
                if (rule.batas_bawah !== null) {
                    // Jika Sensor >= Batas Atas, dan Kipas masih OFF -> NYALAKAN
                    if (currentVal >= rule.nilai && currentState !== perintahBersih) {
                        console.log(`🎯 [OTOMASI] Menyentuh Batas Atas (${currentVal} >= ${rule.nilai}). Menyalakan ${aktuatorBersih}.`);
                        mqttClient.publish(targetTopic, perintahBersih);
                    } 
                    // Jika Sensor <= Batas Bawah, dan Kipas masih ON -> MATIKAN
                    else if (currentVal <= rule.batas_bawah && currentState === perintahBersih) {
                        const perintahMatikan = perintahBersih === 'ON' ? 'OFF' : 'ON';
                        console.log(`🎯 [OTOMASI] Menyentuh Batas Bawah (${currentVal} <= ${rule.batas_bawah}). Mematikan ${aktuatorBersih}.`);
                        mqttClient.publish(targetTopic, perintahMatikan);
                    }
                } 
                // ====================================================
                // 2. LOGIKA LAMA (Hanya 1 Batas Statis)
                // ====================================================
                else {
                    let isConditionMet = false;
                    if (rule.operator === '<') isConditionMet = currentVal < rule.nilai;
                    else if (rule.operator === '>') isConditionMet = currentVal > rule.nilai;
                    else if (rule.operator === '=') isConditionMet = currentVal == rule.nilai;

                    // Hanya kirim pesan jika kondisinya terpenuhi DAN alat belum menyala
                    if (isConditionMet && currentState !== perintahBersih) {
                        console.log(`🎯 [OTOMASI] Aturan Statis Terpenuhi: ${rule.sensor} ${rule.operator} ${rule.nilai}`);
                        mqttClient.publish(targetTopic, perintahBersih);
                    }
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