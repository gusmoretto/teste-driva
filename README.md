# Pipeline de Dados e Monitoramento - Teste Driva

Projeto de Engenharia de Dados simulando um pipeline completo ELT (Extract, Load, Transform) para monitoramento de enriquecimento de dados: **API de Origem -> Ingestão (n8n) -> Data Warehouse (Postgres) -> API de Analytics -> Dashboard**.

## Arquitetura e Tecnologias

### 1. Stack Tecnológico
*   **Backend (Node.js + Express):** Um único serviço (`/api`) hospeda:
    *   *Source API*: Simula a fonte de dados paginada
    *   *Analytics API*: Serve os dados tratados para o dashboard.
    *   *Frontend*: Serve os arquivos HTML/JS.
*   **Banco de Dados (PostgreSQL):** Atua como "Data Warehouse".
*   **Frontend** (HTML5 + TailwindCSS + Chart.js)
*   **Orquestração (n8n):** Controle do agendamento dos fluxos, divisão em fluxos e orquestração em etapas

### 2. Stack de Dados (Camadas)
*   **Bronze Layer (`bronze_enrichments`):** Armazena o dado cru servido pela API (`JSONB`) via `UPSERT`.
*   **Gold Layer (`gold_enrichments`):** Tabela estruturada, tipada e indexada. Contém métricas pré-calculadas (duração em minutos, tradução de status) prontas para consumo imediato do Dashboard.

---

## Workflow n8n: Implementação Detalhada

A orquestração foi dividida em 3 fluxos desacoplados:

### 1. Ingestão Bronze (`1_ingestao_bronze_v3.json`)
*   **Desafio:** A API de origem é paginada
*   **Estratégia:** Implementa um **Loop de Paginação**. O fluxo busca a página 1, escreve no banco, verifica se há mais páginas e itera até o fim.
*   **Segurança:** Utiliza `UPSERT` na tabela `bronze_enrichments` usando o `id` como chave, garantindo idempotência e atualização de registros modificados.

### 2. Processamento Gold (`2_processamento_gold_new.json`)

    *   Query: `SELECT MAX(data_atualizacao_dw) FROM gold_enrichments`
    *   Lógica: Busca na camada Bronze apenas os registros cujo `dw_updated_at` seja maior que a data máxima encontrada na Gold.
*   **Transformação:** Parseia o JSON bruto, traduz status (ex: `COMPLETED` -> `CONCLUIDO`), computa KPIs de performance e categoriza.
*   **Persistência:** Salva na tabela Gold, completando o ciclo ELT.

### 3. Orquestrador (`3_orquestrador_new.json`)
*   **Trigger:** Agendamento Cron (Schedule) a cada 5 minutos.
*   **Lógica:** Executa a Ingestão -> Aguarda Preenchimento -> Executa Processamento.

---

## Estrutura do Projeto

```
teste-driva/
├── api/                    # Servidor Node.js
│   ├── routes/             # Endpoints (Source e Analytics)
│   ├── db.js               # Conexão Postgres
│   └── seed.js             # Script de população inicial
├── dashboard/              # Frontend (Dashboard)
├── docker/                 # Configurações Docker
│   └── postgres/init.sql   # Definição do Schema (Bronze/Gold)
├── docs/                   # Documentação (API e Postman)
├── frontend/               # UI do Dashboard (HTML/JS)
├── workflows/              # Scripts n8n exportados (JSON)
└── docker-compose.yml      # Definição dos serviços
```

## Como Executar

### Pré-requisitos
*   Docker e Docker Compose instalados.

### Passos
1. **Subir o ambiente:**
   ```bash
   docker-compose up -d
   ```

2. **Gerar Massa de Dados (Seed):**
   Isso cria 5.000 registros simulados na "API Externa" para teste.
   ```bash
   docker-compose exec api node seed.js
   ```

3. **Acessar Serviços:**
   *   **Dashboard:** [http://localhost:3000](http://localhost:3000)
   *   **n8n:** [http://localhost:5678](http://localhost:5678)
   *   **API:** [http://localhost:3000/analytics/overview](http://localhost:3000/analytics/overview)

4. **Configurar n8n:**
   *   Acesse o n8n e configure a conexão Postgres (Host: `postgres`, User: `user`, Pass: `postgres`, DB: `driva_db`). (você pode consultar os dados no arquivo .env)
   *   Importe os arquivos da pasta `workflows/` na ordem: Bronze -> Gold -> Orquestrador.
   *   Ative o Orquestrador.

---

##  Documentação da API

- **Postman:** https://gustavomorettodias31-9028952.postman.co/workspace/Gustavo-Moretto-Dias's-Workspac~87d71239-efa9-4197-82e0-76fff81da52f/collection/50284159-c2ee7ccf-b0de-4d50-a7f7-08a1cf6e738a?action=share&creator=50284159 (Collection disponível no postman com exemplos de requisições já montados)

### Exemplos Rápidos (cURL)

```bash
# Simular Fonte de Dados
curl -H "Authorization: Bearer driva_test_key_abc123xyz789" "http://localhost:3000/people/v1/enrichments?page=1"

# Consultar KPIs do Dashboard
curl -H "Authorization: Bearer driva_test_key_abc123xyz789 "http://localhost:3000/analytics/overview"
```
# Utilização de IA

- O uso de IA neste projeto foi como forma de ferramenta de apoio ao desenvolvedor, auxilio com novas ferramentas não utilizadas antes (N8N, ambiente Docker) e também auxilio com resolução de bugs em código, tiragem de dúvidas com decisões,codificação e front-end

##  Licença
Desenvolvido como Teste Técnico para Driva.
