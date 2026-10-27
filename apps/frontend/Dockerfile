# ETAPA 1: Build do React
FROM node:20-alpine AS build

WORKDIR /app

# Força a atualização do npm para a versão 11, que corrige o bug do 'edgesOut'
RUN npm install -g npm@11 --no-audit --no-fund

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ETAPA 2: Servir os arquivos com Nginx (Servidor Web leve)
FROM nginx:alpine

# Copia os arquivos compilados do React para o Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Expõe a porta 80 (padrão do Nginx)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]