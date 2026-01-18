# === BUILD STAGE ===
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Pusty REACT_APP_API_URL = NPM proxy /api do backend
ENV REACT_APP_API_URL=
RUN npm run build

# === PRODUCTION STAGE ===
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx-docker.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
