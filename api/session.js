const { default: makeWASocket, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const archiver = require('archiver');
const fs = require('fs');
const pino = require('pino');

let isConnected = false;

module.exports = async (req, res) => {
    const { action } = req.query;
    const sessionDir = '/tmp/kevs_session';

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    if (action === 'getQR') {
        const { version } = await fetchLatestBaileysVersion();
        const sock = makeWASocket({
            version,
            auth: state,
            browser: Browsers.macOS('Desktop'),
            printQRInTerminal: false,
            logger: pino({ level: 'silent' })
        });

        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                if (!res.headersSent) {
                    res.status(504).json({ error: 'Timeout' });
                    resolve();
                }
            }, 25000);

            sock.ev.on('connection.update', async (update) => {
                const { qr, connection } = update;
                if (qr && !res.headersSent) {
                    const qrDataUrl = await QRCode.toDataURL(qr);
                    res.status(200).json({ qr: qrDataUrl });
                    clearTimeout(timeout);
                }
                if (connection === 'open') {
                    isConnected = true;
                    resolve();
                }
            });
            sock.ev.on('creds.update', saveCreds);
        });
    }

    if (action === 'checkStatus') {
        return res.status(200).json({ connected: isConnected });
    }

    if (action === 'download') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=kev_session.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        archive.directory(sessionDir, false);
        return archive.finalize();
    }
    
    res.status(404).send('Not Found');
};