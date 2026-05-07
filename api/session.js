const { default: makeWASocket, useMultiFileAuthState, Browsers, delay } = require('@whiskeysockets/baileys');
const archiver = require('archiver');
const fs = require('fs');
const pino = require('pino');

let isConnected = false;

module.exports = async (req, res) => {
    const { action, phoneNumber } = req.query;
    const sessionDir = '/tmp/kevs_session';

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // ENDPOINT UNTUK PAIRING CODE
    if (action === 'getPairingCode') {
        if (!phoneNumber) return res.status(400).json({ error: "Nomor HP wajib ada (contoh: 62812xxx)" });

        const sock = makeWASocket({
            auth: state,
            browser: Browsers.ubuntu("Chrome"), // Wajib Chrome/Ubuntu untuk Pairing Code
            logger: pino({ level: 'silent' })
        });

        try {
            // Tunggu sebentar agar socket siap
            await delay(3000);
            const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
            
            // Listen untuk koneksi
            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') isConnected = true;
            });
            sock.ev.on('creds.update', saveCreds);

            return res.status(200).json({ code });
        } catch (err) {
            return res.status(500).json({ error: "Gagal ambil kode. Coba lagi." });
        }
    }

    if (action === 'checkStatus') {
        return res.status(200).json({ connected: isConnected });
    }

    if (action === 'download') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=session_aman.zip');
        const archive = archiver('zip');
        archive.pipe(res);
        archive.directory(sessionDir, false);
        return archive.finalize();
    }
};
