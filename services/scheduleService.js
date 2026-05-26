const cron = require('node-cron');
const supabase = require('../config/supabase');

function initScheduling(mqttClient) {
    // Jalankan pengecekan setiap pergantian menit (detik ke-0)
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // Format "HH:mm"

        try {
            const { data: schedules, error } = await supabase
                .from('otomasi_jadwal')
                .select('*')
                .eq('is_active', true)
                .eq('waktu', currentTime + ':00'); // Mencocokkan dengan "HH:mm:00" di database

            if (schedules && schedules.length > 0) {
                for (const job of schedules) {
                    // Bersihkan spasi gaib dari database
                    const aktuatorBersih = job.aktuator.trim();
                    const perintahBersih = job.perintah.trim();
                    
                    console.log(`⏰ [JADWAL] Waktunya Menjalankan ${aktuatorBersih}: ${perintahBersih}`);
                    
                    // PERBAIKAN: Pisahkan jalur sesuai yang didengar ESP32
                    let targetTopic = '';
                    if (aktuatorBersih === 'Pompa') {
                        targetTopic = 'mewing/relay/pump';
                    } else if (aktuatorBersih === 'Kipas') {
                        targetTopic = 'mewing/relay/fan';
                    }

                    // Tembakkan ke MQTT
                    if (targetTopic !== '') {
                        mqttClient.publish(targetTopic, perintahBersih);
                        console.log(`📡 [PUBLISH] Jadwal menembakkan -> Topik: [${targetTopic}], Perintah: [${perintahBersih}]`);
                    } else {
                        console.log(`⚠️ [WARNING] Aktuator '${aktuatorBersih}' tidak dikenali!`);
                    }
                }
            }
        } catch (err) {
            console.error('❌ Error Schedule Service:', err.message);
        }
    });
}

module.exports = { initScheduling };