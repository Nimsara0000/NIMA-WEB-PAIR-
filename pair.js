const path = require('path');
const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  Browsers,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

const { upload } = require('./mega');

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
  const id = makeid();
  let num = req.query.number;
  if (!num) {
    return res.status(400).send({ error: "Missing number parameter" });
  }

  const statePath = path.join(__dirname, 'temp', id);
  let sentResponse = false;

  async function GIFTED_MD_PAIR_CODE() {
    const { state, saveCreds } = await useMultiFileAuthState(statePath);

    try {
      const randomBrowser = Browsers.macOS('Safari'); // or random if you want

      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        printQRInTerminal: false,
        generateHighQualityLinkPreview: true,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        syncFullHistory: false,
        browser: randomBrowser,
      });

      if (!state.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, '');
        const code = await sock.requestPairingCode(num);
        if (!sentResponse && !res.headersSent) {
          sentResponse = true;
          await res.send({ code });
        }
      } else {
        if (!sentResponse && !res.headersSent) {
          sentResponse = true;
          await res.send({ code: 'Already Registered' });
        }
      }

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on("connection.update", async ({ connection, lastDisconnect }) => {
        if (connection === "open") {
          await delay(5000);

          const credsFile = path.join(statePath, 'creds.json');
          if (fs.existsSync(credsFile)) {
            // Read creds or other logic
          }

          await sock.ws.close();
          await removeFile(statePath);

          console.log(`👤 ${sock.user.id} Connected ⚙️ Restarting process...`);
          await delay(10);
          process.exit();
        } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
          await delay(10);
          await GIFTED_MD_PAIR_CODE();
        }
      });

    } catch (err) {
      console.error(err);
      console.log("Service restarted");
      await removeFile(statePath);

      if (!sentResponse && !res.headersSent) {
        sentResponse = true;
        await res.send({ code: "❗ Service Unavailable" });
      }
    }
  }

  await GIFTED_MD_PAIR_CODE();
});

module.exports = router;
