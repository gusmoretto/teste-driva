FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install --production

# Copiar código fonte
COPY . .

# Variáveis de ambiente
ENV NODE_ENV=production

# Expor porta
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "index.js"]
