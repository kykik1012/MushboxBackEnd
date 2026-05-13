const supabase = require('../config/supabase');
const { checkAndTriggerIrrigation } = require('../services/automationService');

// Variabel untuk mengingat kapan terakhir kali kita menyimpan ke database
let lastInsertTime = 0; 

async function handleSensorData(message, mqttClient) {
    try {
        const data = JSON.parse(message.toString());
        // Console log ini akan tetap muncul tiap 2 detik (Real-time)
        console.log('📡 [SENSOR] Data Masuk:', data);

        // Ambil waktu saat ini dalam bentuk milidetik
        const currentTime = Date.now();

        // Cek apakah selisih waktu sekarang dengan insert terakhir sudah >= 60.000 ms (1 menit)
        if (currentTime - lastInsertTime >= 60000) {
            
            // 1. Simpan ke Database
            const { error } = await supabase
                .from('sensor_history')
                .insert([{ 
                    temp: data.temp, 
                    hum: data.hum, 
                    soil: data.soil, 
                    dist: data.dist,
                    co2: data.co2
                }]);
            
            if (error) {
                console.error('❌ Gagal simpan sensor ke Supabase:', error);
            } else {
                console.log('💾 [DATABASE] Hore! Data 1 menit terakhir berhasil disimpan ke Supabase!');
                // Perbarui catatan waktu terakhir insert ke waktu sekarang
                lastInsertTime = currentTime; 
            }
        }

        // 2. Logika otomasi tetap berjalan secara real-time tiap 2 detik!
        // Jadi kalau tanah tiba-tiba kering, tidak perlu nunggu 1 menit untuk nyiram.
        await checkAndTriggerIrrigation(data, mqttClient);

    } catch (error) {
        console.error('❌ Error memproses data sensor:', error);
    }
}

module.exports = { handleSensorData };