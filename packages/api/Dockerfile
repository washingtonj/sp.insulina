FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY packages/api/package.json packages/api/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/web/package.json packages/web/package.json
RUN npm ci --omit=dev --workspace @sp-insulina/api

COPY packages/api packages/api

WORKDIR /app/packages/api
EXPOSE 3000
CMD ["node", "index.ts"]
