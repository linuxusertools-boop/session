import { default as makeWASocket, useMultiFileAuthState, Browsers, delay } from '@whiskeysockets/baileys';
import pino from 'pino';
import fs from 'fs';

export default async function handler(req, res) {
    const { number } = req.query;
    if (!number) return res.status(400).json({ error: "Nomor diperlukan" });

    const sessionPath = '/tmp/session_auth';
    if (!fs.existsSync(sessionPath)) fs.mkdirSync(sessionPath, { recursive: true });

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: Browsers.ubuntu("Chrome")
    });

    sock.ev.on('creds.update', saveCreds);

    try {
        await delay(3000);
        const code = await sock.requestPairingCode(number.replace(/[^0-9]/g, ''));
        return res.status(200).json({ code });
    } catch (err) {
        return res.status(500).json({ error: "Gagal: " + err.message });
    }
}
