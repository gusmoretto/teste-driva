const express = require('express');
const router = express.Router();
const pool = require('../db');
const { parse } = require('dotenv');

router.get('/enrichments',async (req, res) => {
    
    const authHeader = req.headers.authorization;
    
    const key = 'Bearer ' + process.env.API_SECRET_KEY;
    //Validação da chave de autenticação do user com a variavel de ambiente key
    if (authHeader !== key) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    //Simulação da falha para teste de retry no n8n

    if (Math.random() < 0.1) {
       console.log('Error 429 - Too Many Requests');
       return res.status(429).json({ error: 'Too Many Requests' });    
    }

    try{

        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Máximo de 100
        const offset = (page - 1) * limit;

        const countquery = 'SELECT COUNT(*) FROM api_enrichments_seed';
        
        const data = 'SELECT * FROM api_enrichments_seed ORDER BY created_at DESC LIMIT $1 OFFSET $2';

        const [countResult,dataResult] = await Promise.all([
            pool.query(countquery), 
            pool.query(data,[limit, offset])
        ]);
        
        const totalRecords = parseInt(countResult.rows[0].count);

        const pages = Math.ceil(totalRecords / limit);

        res.json({
            meta:{
                current_page: page,
                items_per_page: limit,
                total_items: totalRecords,
                total_pages: pages
            },
            data: dataResult.rows
        });
    }
    catch(err){
        console.error('Error fetching enrichments:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = router;