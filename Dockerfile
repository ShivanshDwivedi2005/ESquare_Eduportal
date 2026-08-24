FROM node:22-bookworm-slim AS build
WORKDIR /workspace/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci

COPY backend/prisma ./prisma
RUN npx prisma generate

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY backend/tests ./tests
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /workspace/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /workspace/backend/dist ./dist
COPY backend/prisma ./prisma

USER node
EXPOSE 8000
CMD ["node", "dist/src/server.js"]
