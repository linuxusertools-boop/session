import fs from 'fs';
import archiver from 'archiver';
import pino from 'pino';

// Simpan status agar tidak hilang saat polling
let isConnected = false;

export default async function handler(req, res) {
    const { action, phoneNumber } = req.query;
    const sessionDir = '/tmp/kevs_session';

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });

    try {
        // LAZY LOAD BAILEYS: Hanya dimuat saat dibutuhkan
        const { default: makeWASocket, useMultiFileAuthState, Browsers, delay } = await import('@whiskeysockets/baileys');
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        if (action === 'getPairingCode') {
            const sock = makeWASocket({
                auth: state,
                browser: Browsers.ubuntu("Chrome"),
                logger: pino({ level: 'silent' }),
                connectTimeoutMs: 30000,
                keepAliveIntervalMs: 15000
            });

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') isConnected = true;
            });

            // Langsung minta kode tanpa delay lama-lama
            await delay(3000);
            const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
            
            return res.status(200).json({ code });
        }

        if (action === 'checkStatus') {
            // Cek fisik apakah file creds sudah terdaftar
            if (fs.existsSync(`${sessionDir}/creds.json`)) {
                const creds = JSON.parse(fs.readFileSync(`${sessionDir}/creds.json`));
                if (creds.registered) isConnected = true;
            }
            return res.status(200).json({ connected: isConnected });
        }

        if (action === 'download') {
            res.setHeader('Content-Type', 'application/zip');
            const archive = archiver('zip');
            archive.pipe(res);
            archive.directory(sessionDir, false);
            return archive.finalize();
        }

    } catch (err) {
        // Pastikan kalau error tetap kirim JSON, bukan teks biasa!
        return res.status(500).json({ error: err.message });
    }
}
