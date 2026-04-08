const express = require('express');
const path = require('path');
const app = express();
const PORT = 3005;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`⚔️ Barbarian Arena running at http://localhost:${PORT}`);
});
