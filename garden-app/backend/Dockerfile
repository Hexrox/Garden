FROM node:20-alpine

# Sharp i sqlite3 wymagają natywnej kompilacji
RUN apk add --no-cache python3 make g++ vips-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Katalog uploads będzie montowany jako volume
RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "index.js"]
