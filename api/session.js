import { default as makeWASocket, useMultiFileAuthState, Browsers, delay, DisconnectReason } from '@whiskeysockets/baileys';
import archiver from 'archiver';
import fs from 'fs';
import pino from 'pino';

let isConnected = false;

export default async function handler(req, res) {
    const { action, phoneNumber } = req.query;
    const sessionDir = '/tmp/kevs_session';

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    try {
        if (action === 'getPairingCode') {
            const sock = makeWASocket({
                auth: state,
                browser: Browsers.ubuntu("Chrome"),
                logger: pino({ level: 'silent' }),
                // PENTING: Tambahkan ini agar koneksi lebih stabil di Serverless
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 0,
                keepAliveIntervalMs: 10000,
                generateHighQualityLinkPreview: false,
                syncFullHistory: false
            });

            sock.ev.on('creds.update', saveCreds);
            
            sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect } = update;
                if (connection === 'open') isConnected = true;
                
                // Jika koneksi tertutup, cek alasannya
                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('Koneksi terputus karena:', lastDisconnect?.error, '. Reconnect:', shouldReconnect);
                }
            });

            await delay(5000); // Tunggu socket benar-benar siap
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(cleanNumber);
            
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
        return res.status(500).json({ error: "Gagal: " + err.message });
    }
}
