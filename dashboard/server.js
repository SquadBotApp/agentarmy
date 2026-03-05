const express = require('express');
const app = express();
app.get('/status', (req, res) => res.json({ status: 'ok' }));
app.listen(3000, () => console.log('Dashboard server running on port 3000'));
