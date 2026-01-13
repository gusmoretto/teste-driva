const express = require('express');
const router = express.Router();
const pool = require('../db');

// Rota para os KPIs do topo do Dashboard
router.get('/overview', async (req, res) => {
    try {
        // Query que calcula os totais da tabela GOLD
        const query = `
            SELECT 
                COUNT(*) as total_jobs,
                COUNT(*) FILTER (WHERE processamento_sucesso = true) as total_sucesso,
                AVG(duracao_processamento_minutos)::NUMERIC(10,2) as tempo_medio
            FROM gold_enrichments
        `;
        const result = await pool.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
});

// Rota para a lista/tabela do Dashboard
router.get('/enrichments', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM gold_enrichments ORDER BY data_atualizacao_dw DESC LIMIT 50');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao listar dados' });
    }
});

router.get('/workspaces/top', async (req, res) => {
    try {
        const query = `
            SELECT 
                nome_workspace,
                COUNT(*) as total_enrichments
                FROM gold_enrichments
            GROUP BY nome_workspace
            ORDER BY total_enrichments DESC
            LIMIT 5
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar workspaces' });
    }
});

module.exports = router;