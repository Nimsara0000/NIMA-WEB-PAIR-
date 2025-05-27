const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

// Modules
let server = require('./qr');   // QR related routes
let code = require('./pair');  // Pairing code routes

// Increase max listeners to avoid warnings (optional)
require('events').EventEmitter.defaultMaxListeners = 500;

// Use routes
app.use('/server', server);
app.use('/code', code);   // <-- Make sure pairing route is under /code

// Serve static HTML files
app.get('/pair', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'pair.html'));
});

app.get('/qr', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'qr.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'main.html'));
});

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
