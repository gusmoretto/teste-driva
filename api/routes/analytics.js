const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware de autenticação para todas as rotas de analytics
router.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    const requiredKey = 'Bearer ' + (process.env.API_SECRET_KEY || 'driva_test_key_abc123xyz789');

    if (!authHeader || authHeader !== requiredKey) {
        return res.status(401).json({ error: 'Unauthorized: Acesso restrito ao Dashboard' });
    }
    next();
});

// Rota para os KPIs do topo do Dashboard
router.get('/overview', async (req, res) => {
    try {
        // Query que calcula os totais da tabela GOLD
        const query = `
            SELECT 
                COUNT(*) as total_jobs,
                COUNT(*) FILTER (WHERE processamento_sucesso = true) as total_sucesso,
                ROUND(COUNT(*) FILTER (WHERE processamento_sucesso = true) * 100.0 / NULLIF(COUNT(*), 0), 2) as percentual_sucesso,
                AVG(duracao_processamento_minutos)::NUMERIC(10,2) as tempo_medio,
                COUNT(*) FILTER (WHERE categoria_tamanho_job = 'PEQUENO') as cat_pequeno,
                COUNT(*) FILTER (WHERE categoria_tamanho_job = 'MEDIO') as cat_medio,
                COUNT(*) FILTER (WHERE categoria_tamanho_job = 'GRANDE') as cat_grande,
                COUNT(*) FILTER (WHERE categoria_tamanho_job = 'MUITO_GRANDE') as cat_muito_grande
            FROM gold_enrichments
        `;
        const result = await pool.query(query);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar KPIs' });
    }
});

// Rota para a lista/tabela do Dashboard com paginação e filtros
router.get('/enrichments', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const offset = (page - 1) * limit;

        // Filtros opcionais
        const { id_workspace, status, data_inicio, data_fim } = req.query;
        
        let whereClause = [];
        let params = [];
        let paramIndex = 1;

        if (id_workspace) {
            whereClause.push(`id_workspace = $${paramIndex++}`);
            params.push(id_workspace);
        }
        if (status) {
            whereClause.push(`status_processamento = $${paramIndex++}`);
            params.push(status);
        }
        if (data_inicio) {
            whereClause.push(`data_criacao >= $${paramIndex++}`);
            params.push(data_inicio);
        }
        if (data_fim) {
            whereClause.push(`data_criacao <= $${paramIndex++}`);
            params.push(data_fim);
        }

        const whereSQL = whereClause.length > 0 ? `WHERE ${whereClause.join(' AND ')}` : '';

        // Query de contagem
        const countQuery = `SELECT COUNT(*) FROM gold_enrichments ${whereSQL}`;
        const countResult = await pool.query(countQuery, params);
        const totalItems = parseInt(countResult.rows[0].count);

        // Query de dados
        const dataQuery = `
            SELECT * FROM gold_enrichments 
            ${whereSQL} 
            ORDER BY data_atualizacao_dw DESC 
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
        `;
        const dataResult = await pool.query(dataQuery, [...params, limit, offset]);

        res.json({
            meta: {
                current_page: page,
                items_per_page: limit,
                total_items: totalItems,
                total_pages: Math.ceil(totalItems / limit)
            },
            data: dataResult.rows
        });
    } catch (err) {
        console.error('Erro ao listar dados:', err);
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