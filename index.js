const express = require('express');
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 8000;
const __path = process.cwd();

require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware for parsing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routers
let server = require('./qr');
let code = require('./pair');

app.use('/server', server);
app.use('/code', code);

// Static HTML Routes
app.use('/pair', (req, res) => {
  res.sendFile(__path + '/pair.html');
});

app.use('/qr', (req, res) => {
  res.sendFile(__path + '/qr.html');
});

app.use('/', (req, res) => {
  res.sendFile(__path + '/main.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`\nDon't forget to give a star!\n\nServer running on http://localhost:${PORT}`);
});

module.exports = app;
