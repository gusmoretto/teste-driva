const { Pool } = require('pg');
require('dotenv').config();//Utiliza variáveis de ambiente do arquivo .env

// Configuração da conexão com o banco de dados PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER, 
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
});

module.exports = pool;// Exporta o pool de conexões para ser usado em outros módulos