const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT;

app.use(cors());
app.use(express.json());

// --- IMPORTA AS ROTAS ---
const sourceRoutes = require('./routes/source');
const analyticsRoutes = require('./routes/analytics');
const path = require('path');

// --- USA AS ROTAS ---
// Rota da Fonte (Simulada)
app.use('/people/v1', sourceRoutes);

// Rota do Dashboard (Analytics)
app.use('/analytics', analyticsRoutes);


// Front-end
app.use(express.static(path.join(__dirname, '../frontend')));

app.listen(port,'0.0.0.0', () => {
    console.log(`API rodando na porta ${port}`);
});