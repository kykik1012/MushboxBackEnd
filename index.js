// ====================================================
// --- LIVE MONITORING DASHBOARD (MUSHBOX THEME) ---
// ====================================================
app.get('/', (req, res) => {
    // Ambil data terbaru dari MQTT
    const latestData = mqttConfig.getLatestData ? mqttConfig.getLatestData() : null;

    // Definisikan fallback data jika ESP32 belum mengirimkan apa-apa
    const temp = latestData && latestData.temp !== undefined ? latestData.temp : '--';
    const hum = latestData && latestData.hum !== undefined ? latestData.hum : '--';
    const soil = latestData && latestData.soil !== undefined ? latestData.soil : '--';
    const co2 = latestData && latestData.co2 !== undefined ? latestData.co2 : '--';
    const water = latestData && latestData.water ? latestData.water : 'MENUGGU...';
    const pump = latestData && latestData.pump ? latestData.pump.toUpperCase() : 'OFF';
    const fan = latestData && latestData.fan ? latestData.fan.toUpperCase() : 'OFF';
    
    const serverTime = new Date().toLocaleString('id-ID', { 
        timeZone: 'Asia/Jakarta',
        dateStyle: 'medium',
        timeStyle: 'medium'
    });

    // Kirimkan halaman HTML yang sudah didesain sesuai tema MushBox
    res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="3">
        <title>MushBox - IoT Monitoring System</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            
            * {
                box-sizing: border-box;
                margin: 0;
                padding: 0;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }

            body {
                background-color: #F8F9FA;
                color: #2D3748;
                padding: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
            }

            .container {
                width: 100%;
                max-width: 900px;
                background: white;
                border-radius: 24px;
                box-shadow: 0 10px 30px rgba(22, 56, 50, 0.05);
                border: 1px solid #E2E8F0;
                overflow: hidden;
            }

            /* Header Section */
            .header {
                background-color: #163832;
                color: white;
                padding: 30px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 15px;
            }

            .header h1 {
                font-size: 24px;
                font-weight: 700;
                letter-spacing: -0.5px;
            }

            .header p {
                font-size: 13px;
                color: #A3BFFA;
                margin-top: 4px;
            }

            .status-badge {
                background: rgba(232, 240, 237, 0.15);
                padding: 8px 16px;
                border-radius: 50px;
                font-size: 14px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 8px;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .pulse-dot {
                width: 8px;
                height: 8px;
                background: #4DEEEA;
                border-radius: 50%;
                box-shadow: 0 0 0 0 rgba(77, 238, 234, 0.7);
                animation: pulse 1.5s infinite;
            }

            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(77, 238, 234, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(77, 238, 234, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(77, 238, 234, 0); }
            }

            /* Main Content & Grid */
            .content {
                padding: 35px;
            }

            .section-title {
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: #718096;
                margin-bottom: 16px;
                font-weight: 700;
            }

            .grid-sensor {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-bottom: 35px;
            }

            .card {
                background: #F8F9FA;
                border-radius: 16px;
                padding: 20px;
                border: 1px solid #EDF2F7;
                transition: all 0.3s ease;
            }

            .card:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(0,0,0,0.02);
            }

            .card-label {
                font-size: 13px;
                color: #718096;
                font-weight: 600;
                margin-bottom: 8px;
            }

            .card-value {
                font-size: 28px;
                font-weight: 700;
                color: #163832;
            }

            .card-unit {
                font-size: 16px;
                font-weight: 600;
                color: #A0AEC0;
            }

            /* Actuator Control Section */
            .grid-actuator {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
            }

            .actuator-box {
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: white;
                border: 1px solid #E2E8F0;
                padding: 20px;
                border-radius: 16px;
            }

            .actuator-info {
                display: flex;
                align-items: center;
                gap: 15px;
            }

            .actuator-icon {
                width: 48px;
                height: 48px;
                border-radius: 12px;
                display: flex;
                justify-content: center;
                align-items: center;
                font-size: 20px;
            }

            .pump-icon { background: #EBF8FF; color: #3182CE; }
            .fan-icon { background: #FFFAF0; color: #DD6B20; }

            .actuator-name {
                font-weight: 700;
                font-size: 16px;
                color: #2D3748;
            }

            .actuator-desc {
                font-size: 12px;
                color: #718096;
            }

            .status-indicator {
                padding: 6px 16px;
                border-radius: 50px;
                font-size: 13px;
                font-weight: 700;
            }

            .status-on {
                background-color: #C6F6D5;
                color: #22543D;
            }

            .status-off {
                background-color: #FED7D7;
                color: #742A2A;
            }

            /* Footer */
            .footer-text {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #A0AEC0;
                border-top: 1px solid #EDF2F7;
                background: #FAFAFA;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div>
                    <h1>MushBox IoT System</h1>
                    <p>Terakhir diperbarui: ${serverTime} WIB</p>
                </div>
                <div class="status-badge">
                    <div class="pulse-dot"></div>
                    <span>LIVE MONITORING</span>
                </div>
            </div>

            <div class="content">
                <div class="section-title">Kondisi Kumbung Jamur</div>
                <div class="grid-sensor">
                    <div class="card">
                        <div class="card-label">🌡️ Suhu Udara</div>
                        <div class="card-value">${temp}<span class="card-unit">°C</span></div>
                    </div>
                    <div class="card">
                        <div class="card-label">💧 Kelembaban Udara</div>
                        <div class="card-value">${hum}<span class="card-unit">%</span></div>
                    </div>
                    <div class="card">
                        <div class="card-label">🌱 Kelembaban Tanah</div>
                        <div class="card-value">${soil}<span class="card-unit">%</span></div>
                    </div>
                    <div class="card">
                        <div class="card-label">💨 Kualitas Udara (CO2)</div>
                        <div class="card-value">${co2}<span class="card-unit">%</span></div>
                    </div>
                    <div class="card">
                        <div class="card-label">🪣 Level Air Tangki</div>
                        <div class="card-value" style="font-size: 22px; padding-top: 8px;">${water}</div>
                    </div>
                </div>

                <div class="section-title">Status Perangkat Aktuator</div>
                <div class="grid-actuator">
                    <div class="actuator-box">
                        <div class="actuator-info">
                            <div class="actuator-icon pump-icon">💧</div>
                            <div>
                                <div class="actuator-name">Pompa Penyemprot</div>
                                <div class="actuator-desc">Sistem Pengkabutan Air</div>
                            </div>
                        </div>
                        <div class="status-indicator ${pump === 'ON' ? 'status-on' : 'status-off'}">
                            ${pump}
                        </div>
                    </div>

                    <div class="actuator-box">
                        <div class="actuator-info">
                            <div class="actuator-icon fan-icon">🌀</div>
                            <div>
                                <div class="actuator-name">Kipas Ventilasi</div>
                                <div class="actuator-desc">Sirkulasi & Pendingin Udara</div>
                            </div>
                        </div>
                        <div class="status-indicator ${fan === 'ON' ? 'status-on' : 'status-off'}">
                            ${fan}
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer-text">
                MushBox Server &copy; 2026 - Teknologi Informasi Universitas Jember
            </div>
        </div>
    </body>
    </html>
    `);
});