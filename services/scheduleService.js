const cron = require('node-cron');
const supabase = require('../config/supabase');

function initScheduling(mqttClient) {
    // Jalankan pengecekan setiap menit
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // Format "HH:mm"

        try {
            const { data: schedules, error } = await supabase
                .from('otomasi_jadwal')
                .select('*')
                .eq('is_active', true)
                .eq('waktu', currentTime + ':00'); // Mencocokkan HH:mm:00

            if (schedules && schedules.length > 0) {
                for (const job of schedules) {
                    console.log(`⏰ [JADWAL] Menjalankan ${job.aktuator}: ${job.perintah}`);
                    const topic = job.aktuator === 'Pompa' ? 'mewing/relay/control' : 'mewing/relay/control';
                    mqttClient.publish(topic, job.perintah);
                }
            }
        } catch (err) {
            console.error('❌ Error Schedule Service:', err.message);
        }
    });
}

module.exports = { initScheduling };