# Build stage
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:5000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY client/package.json client/package-lock.json* ./client/
WORKDIR /app/client
RUN npm install
WORKDIR /app
COPY client ./client
COPY shared ./shared
WORKDIR /app/client
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html

# SPA routing için nginx config
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
