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

// --- USA AS ROTAS ---
// Rota da Fonte (Simulada)
app.use('/people/v1', sourceRoutes);

// Rota do Dashboard (Analytics)
app.use('/analytics', analyticsRoutes);

// Rota base para teste
app.get('/', (req, res) => {
    res.json({ status: 'Driva API Online' });
});

app.listen(port, () => {
    console.log(`API rodando na porta ${port}`);
});