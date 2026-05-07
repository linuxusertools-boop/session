import { default as makeWASocket, useMultiFileAuthState, Browsers, delay } from '@whiskeysockets/baileys';
import archiver from 'archiver';
import fs from 'fs';
import pino from 'pino';

let isConnected = false;

export default async function handler(req, res) {
    const { action, phoneNumber } = req.query;
    const sessionDir = '/tmp/session_' + (phoneNumber || 'default');

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    try {
        if (action === 'getPairingCode') {
            if (!phoneNumber) return res.status(400).json({ error: "Nomor diperlukan" });

            const sock = makeWASocket({
                auth: state,
                browser: Browsers.ubuntu("Chrome"),
                logger: pino({ level: 'silent' })
            });

            sock.ev.on('creds.update', saveCreds);
            sock.ev.on('connection.update', (update) => {
                if (update.connection === 'open') isConnected = true;
            });

            await delay(3000);
            const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
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
        return res.status(500).json({ error: err.message });
    }

    res.status(404).json({ error: "Not Found" });
}
            const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
            const code = await sock.requestPairingCode(cleanNumber);
            
            return res.status(200).json({ code });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Server Error: " + err.message });
        }
    }

    if (action === 'checkStatus') {
        return res.status(200).json({ connected: isConnected });
    }

    if (action === 'download') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=session.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        archive.directory(sessionDir, false);
        return archive.finalize();
    }

    res.status(404).send('Not Found');
}
            const code = await sock.requestPairingCode(cleanNumber);
            
            return res.status(200).json({ code });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal: " + err.message });
        }
    }

    if (action === 'checkStatus') {
        return res.status(200).json({ connected: isConnected });
    }

    if (action === 'download') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=session.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        archive.directory(sessionDir, false);
        return archive.finalize();
    }

    res.status(404).send('Not Found');
}

        try {
            await delay(3000);
            // Request pairing code
            const code = await sock.requestPairingCode(phoneNumber.replace(/[^0-9]/g, ''));
            return res.status(200).json({ code });
        } catch (err) {
            return res.status(500).json({ error: "Gagal mendapatkan kode. Coba lagi." });
        }
    }

    if (action === 'checkStatus') {
        return res.status(200).json({ connected: isConnected });
    }

    if (action === 'download') {
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=session.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(res);
        archive.directory(sessionDir, false);
        return archive.finalize();
    }

    res.status(404).send('Not Found');
};


        .api-item {
            background: var(--white);
            border: 4px solid var(--black);
            box-shadow: var(--shadow);
            overflow: hidden;
            margin-top: 2rem;
        }

        .api-header {
            padding: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--white);
            border-bottom: 4px solid var(--black);
        }

        .method-tag { 
            font-size: 0.8rem; 
            background: var(--accent); 
            color: var(--black); 
            padding: 4px 12px;
            border: 2px solid var(--black);
            font-weight: bold;
        }

        .api-content {
            padding: 2rem;
            text-align: center;
        }

        .input-group {
            margin: 1.5rem 0;
            text-align: left;
        }

        label { font-weight: 900; font-size: 0.9rem; text-transform: uppercase; }

        input {
            width: 100%;
            padding: 15px;
            margin-top: 8px;
            border: 4px solid var(--black);
            font-family: inherit;
            font-size: 1.1rem;
            font-weight: bold;
            outline: none;
            background: var(--white);
        }

        input:focus { background: #fffcf0; }

        .pairing-code-box {
            margin: 2rem 0;
            padding: 1.5rem;
            background: #e7e7e7;
            border: 4px dashed var(--black);
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #code-display {
            font-size: 3rem;
            font-weight: 900;
            letter-spacing: 8px;
            color: var(--black);
        }

        button {
            width: 100%;
            padding: 18px;
            background: var(--black);
            color: var(--white);
            border: none;
            font-size: 1.1rem;
            font-weight: 900;
            cursor: pointer;
            text-transform: uppercase;
            box-shadow: 4px 4px 0px #555;
            transition: 0.1s;
        }

        button:active {
            transform: translate(3px, 3px);
            box-shadow: 0px 0px 0px #555;
        }

        button:disabled { background: #888; cursor: not-allowed; }

        .status-msg {
            margin-top: 1.5rem;
            padding: 10px;
            font-weight: bold;
            font-size: 0.9rem;
            border: 2px solid var(--black);
            display: none;
        }

        footer { text-align: center; margin-top: 4rem; font-weight: bold; opacity: 0.6; }
    </style>
</head>
<body>

<div class="container">
    <header>
        <div class="logo-title">KEV<br>SESSION</div>
        <p style="font-weight: bold; margin-top: 10px;">V1.2.0 • STABLE PAIRING</p>
    </header>

    <div class="api-item">
        <div class="api-header">
            <h3 style="font-weight: 900;">SESSION GRABBER</h3>
            <span class="method-tag">PAIRING CODE</span>
        </div>
        <div class="api-content">
            <p style="font-weight: 500;">Dapatkan session WhatsApp tanpa scan QR. Lebih cepat dan anti-timeout.</p>
            
            <div class="input-group">
                <label for="phone">Nomor WhatsApp (Gunakan Kode Negara)</label>
                <input type="text" id="phone" placeholder="Contoh: 628123456789">
            </div>

            <div class="pairing-code-box">
                <div id="code-display">--------</div>
            </div>

            <button id="gen-btn" onclick="getPairingCode()">Generate Code</button>

            <div id="status" class="status-msg"></div>
        </div>
    </div>

    <footer>
        BY KEVCODEX &copy; 2026
    </footer>
</div>

<script>
    let pollInterval;

    async function getPairingCode() {
        const phone = document.getElementById('phone').value;
        const status = document.getElementById('status');
        const codeDisplay = document.getElementById('code-display');
        const btn = document.getElementById('gen-btn');
        
        if(!phone || phone.length < 10) {
            alert("Masukkan nomor WhatsApp yang valid (contoh: 628xxx)");
            return;
        }

        btn.disabled = true;
        status.style.display = "block";
        status.style.background = "#eee";
        status.innerHTML = "Sedang meminta kode dari server...";
        codeDisplay.innerHTML = "....";

        try {
            // Memanggil API Backend
            const response = await fetch(`/api/session?action=getPairingCode&phoneNumber=${phone}`);
            const data = await response.json();
            
            if (data.code) {
                codeDisplay.innerHTML = data.code;
                status.style.background = "#fff";
                status.innerHTML = "KODE BERHASIL! Cek notifikasi di HP Anda dan masukkan kode tersebut.";
                startPolling();
            } else {
                throw new Error(data.error || "Gagal");
            }
        } catch (err) {
            btn.disabled = false;
            status.style.background = "#ff9494";
            status.innerHTML = "Gagal: " + err.message;
            codeDisplay.innerHTML = "ERROR";
        }
    }

    function startPolling() {
        if(pollInterval) clearInterval(pollInterval);
        
        pollInterval = setInterval(async () => {
            try {
                const res = await fetch('/api/session?action=checkStatus');
                const data = await res.json();
                
                if (data.connected) {
                    const status = document.getElementById('status');
                    status.style.background = "#25d366";
                    status.innerHTML = "TERHUBUNG! Menyiapkan download...";
                    clearInterval(pollInterval);
                    
                    // Delay sedikit sebelum download
                    setTimeout(() => {
                        window.location.href = '/api/session?action=download';
                    }, 2000);
                }
            } catch (e) {}
        }, 4000);
    }
</script>

</body>
</html>
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
