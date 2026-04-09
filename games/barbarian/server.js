// Copyright (c) 2026 EficodeDemoOrg. Licensed under the MIT License.
// See LICENSE file in the project root for full license information.

const express = require('express');
const path = require('path');
const app = express();
const PORT = 3005;

// Disable X-Powered-By
app.disable('x-powered-by');

// Security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, '127.0.0.1', () => {
    console.log(`⚔️ Barbarian Arena running at http://localhost:${PORT}`);
});
