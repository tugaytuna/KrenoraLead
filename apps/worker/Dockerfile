FROM node:22-slim

WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/worker ./apps/worker
COPY packages ./packages
RUN npm ci

ENV NODE_ENV=production
ENV WORKER_RUN_ONCE=true
CMD ["./node_modules/.bin/tsx", "apps/worker/src/index.ts"]
