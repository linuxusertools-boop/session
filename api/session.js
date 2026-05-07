const { default: makeWASocket, useMultiFileAuthState, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const archiver = require('archiver');
const fs = require('fs');
const pino = require('pino');

// Global variable untuk menyimpan status (hanya selama instance warm)
let qrCodeData = null;
let isConnected = false;

module.exports = async (req, res) => {
    const { action } = req.query;
    const sessionDir = '/tmp/kevs_session';

    if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    if (action === 'getQR') {
        // Jika sudah ada QR yang ter-generate, langsung kirim
        if (qrCodeData && !isConnected) {
            return res.status(200).json({ qr: qrCodeData });
        }

        const sock = makeWASocket({
            auth: state,
            browser: Browsers.macOS('Desktop'),
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }),
            connectTimeoutMs: 60000, // Tambah durasi timeout
            defaultQueryTimeoutMs: 0
        });

        return new Promise((resolve) => {
            // Berikan respon cepat ke frontend agar tidak timeout
            const timeoutHandler = setTimeout(() => {
                if (!res.headersSent) {
                    res.status(200).json({ status: "processing", message: "Silakan refresh dalam 3 detik" });
                    resolve();
                }
            }, 8000);

            sock.ev.on('connection.update', async (update) => {
                const { qr, connection } = update;
                
                if (qr) {
                    qrCodeData = await QRCode.toDataURL(qr);
                    if (!res.headersSent) {
                        res.status(200).json({ qr: qrCodeData });
                        clearTimeout(timeoutHandler);
                        resolve();
                    }
                }

                if (connection === 'open') {
                    isConnected = true;
                    qrCodeData = null; // Reset QR karena sudah terhubung
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
