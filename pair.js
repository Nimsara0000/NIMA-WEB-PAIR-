const express = require('express');
const router = express.Router();
const fs = require('fs');
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

// Helper to generate random string ID (used for folder name)
function makeid(length = 10) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++)
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
}

router.get('/', async (req, res) => {
    console.log("Pairing request received");
    let num = req.query.number;

    if (!num) {
        return res.status(400).send({ error: "Phone number query parameter is required." });
    }

    num = num.replace(/[^0-9]/g, ''); // Clean number to digits only

    const id = makeid();

    async function GIFTED_MD_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS('Safari')
            });

            if (!sock.authState.creds.registered) {
                await delay(1500);
                console.log("Requesting pairing code for number:", num);
                const code = await sock.requestPairingCode(num);

                if (!res.headersSent) {
                    return res.send({ code });
                }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === "open") {
                    console.log("Connection opened with WhatsApp");

                    await delay(5000);

                    let credFilePath = __dirname + `/temp/${id}/creds.json`;

                    if (!fs.existsSync(credFilePath)) {
                        console.error("Credentials file not found.");
                        return;
                    }

                    // Upload creds file to mega
                    const mega_url = await upload(fs.createReadStream(credFilePath), `${sock.user.id}.json`);
                    const string_session = mega_url.replace('https://mega.nz/file/', '');
                    let md = "DINU-MD&" + string_session;

                    // Send the session string back to user
                    let codeMsg = await sock.sendMessage(sock.user.id, { text: md });

                    // Send confirmation message
                    let desc = `*Session connected successfully*`;

                    await sock.sendMessage(sock.user.id, { text: desc }, { quoted: codeMsg });

                    // Cleanup and close socket
                    await delay(10);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);

                    console.log(`User ${sock.user.id} connected. Exiting process.`);
                    await delay(10);
                    process.exit();

                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log("Disconnected unexpectedly, retrying...");
                    await delay(10);
                    GIFTED_MD_PAIR_CODE();
                }
            });

        } catch (err) {
            console.error("Error during pairing:", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                return res.status(503).send({ code: "❗ Service Unavailable" });
            }
        }
    }

    await GIFTED_MD_PAIR_CODE();
});

module.exports = router;
