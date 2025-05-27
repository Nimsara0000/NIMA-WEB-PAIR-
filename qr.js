const { makeid } = require('./gen-id');
const express = require('express');
const QRCode = require('qrcode');
const fs = require('fs');
const pino = require("pino");
const router = express.Router();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  Browsers,
} = require("@whiskeysockets/baileys");

const { upload } = require('./mega');

function removeFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath, { recursive: true, force: true });
  }
}

router.get('/', async (req, res) => {
  const id = makeid();

  async function startSession() {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);

      // Create WhatsApp socket connection
      const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: Browsers.macOS("Desktop"),
      });

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          // Send QR code image buffer to client immediately
          const qrBuffer = await QRCode.toBuffer(qr);
          res.end(qrBuffer);
        }

        if (connection === "open") {
          // Wait a bit before reading session file
          await delay(5000);

          const credsPath = `./temp/${id}/creds.json`;
          if (!fs.existsSync(credsPath)) {
            console.error("creds.json not found after connection open");
            return;
          }

          // Generate your random text if needed (currently unused)
          function generateRandomText() {
            const prefix = "3EB";
            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            let randomText = prefix;
            for (let i = prefix.length; i < 22; i++) {
              randomText += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return randomText;
          }
          const randomText = generateRandomText();

          try {
            // Upload creds.json file to mega and get URL
            const megaUrl = await upload(fs.createReadStream(credsPath), `${sock.user.id}.json`);
            const string_session = megaUrl.replace('https://mega.nz/file/', '');
            const md = "DINU-MD&" + string_session;

            // Send MD string to WhatsApp user
            const sentMsg = await sock.sendMessage(sock.user.id, { text: md });

            // Prepare description message
            const desc = `*┏━━━━━━━━━━━━━━*\n*┃𝑆𝑅_𝐷𝙸𝙽𝚄_𝛭𝙳 𝑆𝙴𝚂𝚂𝙸𝙾𝙽 𝐼𝚂*\n*┃𝑆𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈*\n*┃𝐶ONNECTED ⚡🔥*\n*┗━━━━━━━━━━━━━━━*\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝐶𝑅𝛯𝜟亇𝛩𝑅 =_𝙳𝙸𝙽𝚄_𝙼𝙳💻🥷🏼\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝑆𝑅 亇𝛯𝑆𝐻 𝛩ꪝ𝚴𝛯𝑅 _ 𝐷𝐼𝚴び\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝛩ꪝ𝚴𝛯𝑅 = https://wa.me/+94740026280\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝑅𝛯𝛲𝛩 = https://github.com/dinujaya423/SR-TECH_DINU\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n*•|| 🥷🏼💻𝐶𝑅𝛯𝜟亇𝛯𝐷 𝛣𝑌 "𝐷𝐼𝚴び  ||•💻🥷🏼*`;

            await sock.sendMessage(sock.user.id, {
              text: desc,
              contextInfo: {
                externalAdReply: {
                  title: "𝑆𝑅 亇𝛯𝑆𝐻 _ 𝐷𝐼𝚴び",
                  thumbnailUrl: "https://i.ibb.co/XZFdhy0/IMG-20250102-WA0065.jpg",
                  sourceUrl: "https://whatsapp.com/channel/0029VaN1XMn2ZjCsu9eZQP3R",
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            }, { quoted: sentMsg });

          } catch (error) {
            console.error("Error sending messages:", error);

            const errorDesc = `*┏━━━━━━━━━━━━━━*\n*┃𝑆𝑅_𝐷𝙸𝙽𝚄_𝛭𝙳 𝑆𝙴𝚂𝚂𝙸𝙾𝙽 𝐼𝚂*\n*┃𝑆𝚄𝙲𝙲𝙴𝚂𝚂𝙵𝚄𝙻𝙻𝚈*\n*┃𝐶ONNECTED ⚡🔥*\n*┗━━━━━━━━━━━━━━━*\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝐶𝑅𝛯𝜟亇𝛩𝑅 =_𝙳𝙸𝙽𝚄_𝙼𝙳💻🥷🏼\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝑆𝑅 亇𝛯𝑆𝐻 𝛩ꪝ𝚴𝛯𝑅 _ 𝐷𝐼𝚴び\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝛩ꪝ𝚴𝛯𝑅 = https://wa.me/+94740026280\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n* || 𝑅𝛯𝛲𝛩 = https://github.com/dinujaya423/SR-TECH_DINU\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n*•|| 🥷🏼💻𝐶𝑅𝛯𝜟亇𝛯𝐷 𝛣𝑌 "𝐷𝐼𝚴び  ||•💻*`;

            await sock.sendMessage(sock.user.id, {
              text: errorDesc,
              contextInfo: {
                externalAdReply: {
                  title: "𝑆𝑅 亇𝛯𝑆𝐻 _ 𝐷𝐼𝚴び",
                  thumbnailUrl: "https://ibb.co/99QND3cp",
                  sourceUrl: "https://whatsapp.com/channel/0029VbAeM185a246gjrJkP2X",
                  mediaType: 2,
                  renderLargerThumbnail: true,
                  showAdAttribution: true
                }
              }
            });
          }

          await delay(10);
          await sock.ws.close();
          removeFile(`./temp/${id}`);

          console.log(`👤 ${sock.user.id} connected, restarting process...`);
          await delay(10);
          process.exit();

        } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
          await delay(10);
          startSession();
        }
      });

    } catch (err) {
      console.error("Service restarted due to error", err);
      removeFile(`./temp/${id}`);
      if (!res.headersSent) {
        res.status(503).send({ code: "❗ Service Unavailable" });
      }
    }
  }

  await startSession();
});

// Auto-restart every 30 minutes
setInterval(() => {
  console.log("◄⚙️ Restarting process...");
  process.exit();
}, 1800000); // 30 minutes

module.exports = router;
