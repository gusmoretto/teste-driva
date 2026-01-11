-- =========================================================
-- 1. TABELA DE SEED (Simulação da API de Origem)
-- =========================================================
CREATE TABLE IF NOT EXISTS api_enrichments_seed (
    id UUID PRIMARY KEY,
    id_workspace UUID,
    workspace_name TEXT,
    total_contacts INTEGER,
    contact_type TEXT,
    status TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- =========================================================
-- 2. TABELAS DE NEGÓCIO (DW)
-- =========================================================

-- CAMADA BRONZE (Dados Brutos)
CREATE TABLE IF NOT EXISTS bronze_enrichments (
    id TEXT PRIMARY KEY,
    original_data JSONB NOT NULL,
    dw_ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dw_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAMADA GOLD (Dados Processados)
CREATE TABLE IF NOT EXISTS gold_enrichments (
    id_enriquecimento TEXT PRIMARY KEY,
    id_workspace TEXT,
    nome_workspace TEXT,
    total_contatos INTEGER,
    tipo_contato TEXT,
    status_processamento TEXT,
    data_criacao TIMESTAMP,
    data_atualizacao TIMESTAMP,
    
    -- Campos Calculados
    duracao_processamento_minutos FLOAT,
    tempo_por_contato_minutos FLOAT,
    processamento_sucesso BOOLEAN,
    categoria_tamanho_job TEXT,
    necessita_reprocessamento BOOLEAN,
    
    -- Controle de carga
    data_atualizacao_dw TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX idx_gold_workspace ON gold_enrichments(id_workspace);
CREATE INDEX idx_gold_status ON gold_enrichments(status_processamento);

-- Tabela para guardar o estado dos pipelines (Watermark)
-- Exemplo de uso: Pipeline 'ingestion_enrichments' parou na data '2025-01-10 10:00:00'
CREATE TABLE IF NOT EXISTS dw_pipeline_control (
    pipeline_name TEXT PRIMARY KEY,    -- Nome do fluxo (ex: 'ingestao_api')
    last_run_at TIMESTAMP,             -- Quando rodou pela última vez
    status_last_run TEXT,              -- 'SUCCESS', 'FAILED'
    watermark_value TEXT,              -- O valor de corte (ex: '2025-11-15T14:30:00Z')
    total_records_processed INTEGER DEFAULT 0
);

-- Inserir o registro inicial para não dar erro no primeiro SELECT do n8n
INSERT INTO dw_pipeline_control (pipeline_name, last_run_at, status_last_run, watermark_value)
VALUES ('ingestao_api', NOW(), 'INIT', '1970-01-01T00:00:00Z')
ON CONFLICT (pipeline_name) DO NOTHING;