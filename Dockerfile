ARG NODE_VERSION=26.12.0

FROM node:${NODE_VERSION}-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig*.json ./
COPY public ./public
COPY resources ./resources
COPY src ./src

RUN npm run build

FROM nginx:alpine AS runtime
ARG APP_VERSION=dev
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# The flixer API reads this to show which web version is running in the admin dashboard.
RUN printf '{"version":"%s"}' "$APP_VERSION" > /usr/share/nginx/html/version.json

EXPOSE 80
