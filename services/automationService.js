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
            const perintahMatikan = perintahBersih === 'ON' ? 'OFF' : 'ON'; // Biasanya 'OFF'
            const targetTopic = TOPICS[aktuatorBersih];
            
            const currentState = aktuatorBersih === 'Pompa' ? sensorData.pump : sensorData.fan;

            if (targetTopic) {
                // ====================================================
                // 1. LOGIKA BARU: BATAS ATAS & BATAS BAWAH (HYSTERESIS KUAT)
                // ====================================================
                if (rule.batas_bawah !== null) {
                    
                    // KONDISI 1: Menyentuh/Melewati Batas Atas -> PAKSA HIDUP
                    if (currentVal >= rule.nilai) {
                        mqttClient.publish(targetTopic, perintahBersih);
                        
                        // Catat ke history HANYA 1 KALI (saat alat dari mati berubah jadi hidup)
                        if (currentState !== perintahBersih) {
                            console.log(`🎯 [OTOMASI] Menyentuh Batas Atas (${currentVal} >= ${rule.nilai}). Menyalakan ${aktuatorBersih}.`);
                            await supabase.from('otomasi_riwayat').insert({
                                aktuator: aktuatorBersih,
                                perintah: perintahBersih
                            });
                        }
                    } 
                    
                    // KONDISI 2: Menyentuh/Turun dari Batas Bawah -> PAKSA MATI
                    else if (currentVal <= rule.batas_bawah) {
                        mqttClient.publish(targetTopic, perintahMatikan);

                        // Catat ke history HANYA 1 KALI (saat alat dari hidup berubah jadi mati)
                        if (currentState === perintahBersih) {
                            console.log(`🎯 [OTOMASI] Menyentuh Batas Bawah (${currentVal} <= ${rule.batas_bawah}). Mematikan ${aktuatorBersih}.`);
                            await supabase.from('otomasi_riwayat').insert({
                                aktuator: aktuatorBersih,
                                perintah: perintahMatikan
                            });
                        }
                    }

                    // KONDISI 3: Jika nilai berada di antara Atas dan Bawah, DIAM SAJA.
                    // (Logika if-else di atas otomatis membuat Node.js mengabaikan nilai di rentang ini)
                } 
                // ====================================================
                // 2. LOGIKA LAMA (Hanya 1 Batas Statis)
                // ====================================================
                else {
                    let isConditionMet = false;
                    if (rule.operator === '<') isConditionMet = currentVal < rule.nilai;
                    else if (rule.operator === '>') isConditionMet = currentVal > rule.nilai;
                    else if (rule.operator === '=') isConditionMet = currentVal == rule.nilai;

                    // Untuk aturan lama, tetap gunakan pencegah spam aslinya
                    if (isConditionMet && currentState !== perintahBersih) {
                        console.log(`🎯 [OTOMASI] Aturan Statis Terpenuhi: ${rule.sensor} ${rule.operator} ${rule.nilai}`);
                        mqttClient.publish(targetTopic, perintahBersih);

                        await supabase.from('otomasi_riwayat').insert({
                            aktuator: aktuatorBersih,
                            perintah: perintahBersih
                        });
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