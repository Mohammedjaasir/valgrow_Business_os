# ValGrow API (NestJS + Prisma) — build context is the REPO ROOT.
#   docker build -f apps/api/Dockerfile -t valgrow-api .
# Coolify: Build Pack = Dockerfile, Base Directory = /, Dockerfile Location = /apps/api/Dockerfile, Port = 3001
FROM node:20-bookworm-slim

# openssl for Prisma's query engine; build tools in case bcrypt has no prebuilt binary.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install only the API workspace's dependencies (npm needs every workspace manifest to read the lockfile).
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci --workspace=apps/api --include-workspace-root

COPY prisma ./prisma
COPY apps/api ./apps/api
RUN npx prisma generate && npm run build --workspace=apps/api

ENV NODE_ENV=production
ENV API_PORT=3001
EXPOSE 3001

# The schema is ahead of the committed migrations, so sync it on start.
# `db push` refuses destructive changes, so a risky schema change fails loudly instead of losing data.
CMD ["sh", "-c", "npx prisma db push --skip-generate && node apps/api/dist/src/main.js"]
