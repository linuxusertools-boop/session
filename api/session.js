import { default as makeWASocket, useMultiFileAuthState, Browsers, delay } from '@whiskeysockets/baileys';
import archiver from 'archiver';
import fs from 'fs';
import pino from 'pino';

// Simpan status di memori sementara (warm instance)
let isConnected = false;

export default async function handler(req, res) {
    const { action, phoneNumber } = req.query;
    const sessionDir = '/tmp/session_kev';

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    try {
        if (action === 'getPairingCode') {
            if (!phoneNumber) return res.status(400).json({ error: "Nomor diperlukan" });

            const sock = makeWASocket({
                auth: state,
                browser: Browsers.ubuntu("Chrome"),
                logger: pino({ level: 'silent' }),
                // Matikan sinkronisasi history agar super ringan
                syncFullHistory: false,
                markOnlineOnConnect: false
            });

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') isConnected = true;
            });

            // Trik utama: Request kode secepat mungkin
            await delay(2000); 
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(cleanNumber);
            
            // Segera kirim JSON sebelum Vercel berubah pikiran
            return res.status(200).json({ code });
        }

        if (action === 'checkStatus') {
            return res.status(200).json({ connected: isConnected });
        }

        if (action === 'download') {
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=session.zip');
            const archive = archiver('zip');
            archive.pipe(res);
            archive.directory(sessionDir, false);
            return archive.finalize();
        }
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Gagal: " + err.message });
    }
}
