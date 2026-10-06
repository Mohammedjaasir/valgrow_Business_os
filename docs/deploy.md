# Deploying ValGrow Business OS

**Web** → Vercel · **API + Database** → your Coolify server

The browser only ever talks to the Vercel domain. Requests to `/api/*` are forwarded by Vercel to the API on Coolify, so login cookies stay first-party. The API reaches Postgres over Coolify's private network — the database never needs a public port.

```
Browser ──► https://<app>.vercel.app ──/api/*──► https://api.<your-domain> (Coolify) ──private──► Postgres (Coolify)
```

Do the steps in order — each one needs a value from the previous.

## 1. Database — PostgreSQL on Coolify

1. Project → environment → **+ New → Database → PostgreSQL 16** (matches local dev's `postgres:16-alpine`).
2. Keep the generated password. Set **Initial Database** to `valgrow` *before the first start*.
3. Leave **Make it publicly available** off and **Ports Mappings** empty — the API connects privately.
4. **Start** it, then copy **Postgres URL (internal)** (you'll paste it into the API's environment).
5. **Backups** tab → schedule daily backups to an S3-compatible bucket.

## 2. API — Application on Coolify

1. Same project/environment → **+ New → Application → Private Repository (GitHub App)** → `valgrow_Business_os`, branch `main`.
2. Configuration:

   | Field | Value |
   |---|---|
   | Build Pack | **Dockerfile** |
   | Base Directory | `/` |
   | Dockerfile Location | `/apps/api/Dockerfile` |
   | Port (Ports Exposes) | `3001` |

3. **Domains:** set the API domain, e.g. `https://api.your-domain.com` (point a DNS `A` record at the server first — Coolify issues the HTTPS certificate). Without a domain, use the generated `sslip.io` URL for testing.
4. **Environment Variables:**

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | Postgres URL (internal) from step 1 |
   | `NODE_ENV` | `production` |
   | `API_PORT` | `3001` |
   | `WEB_URL` | your Vercel URL — use `https://placeholder.vercel.app` until step 4 |
   | `JWT_SECRET` | long random string (e.g. `openssl rand -hex 32`) |
   | `JWT_REFRESH_SECRET` | a *different* long random string |
   | `JWT_EXPIRY` | `15m` |
   | `JWT_REFRESH_EXPIRY` | `7d` |
   | `BCRYPT_ROUNDS` | `12` |

5. **Health check:** path `/health`, port `3001`.
6. **Deploy.** On start the container creates the tables (`prisma db push`). Open `https://api.your-domain.com/health` — you should get a JSON response.

## 3. Seed the database (once)

In Coolify → the API application → **Terminal**, run:

```bash
npm run seed --workspace=apps/api
```

This creates the demo organization, users, products and chart of accounts. The seeded login is `alex.verma@valgrow.dev` / `DevelopmentPass123!` — **change that password before sharing the URL.**

## 4. Web — Vercel

1. https://vercel.com/new → **Import** `ValGrow-Labs/valgrow_Business_os`.
2. **Root Directory:** `apps/web`. Framework Preset: *Other* (build settings come from `apps/web/vercel.json`).
3. **Environment Variables** (Production):

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `/api` |
   | `API_PROXY_TARGET` | your API URL from step 2, e.g. `https://api.your-domain.com` |
   | `NITRO_PRESET` | `vercel` |

4. **Deploy** and copy the production URL.

## 5. Connect them

1. Coolify → API → Environment Variables → set `WEB_URL` to the exact Vercel URL (no trailing slash) → **Redeploy**.
2. Open the Vercel URL and sign in.

Pushes to `main` redeploy Vercel automatically; in Coolify enable **Auto Deploy** on the application (GitHub App webhook) for the API.

## Good to know

- **Preview deployments** (Vercel branch/PR URLs) are blocked by the API's CORS rule, which allows only `WEB_URL`.
- **Changing `API_PROXY_TARGET`** requires a Vercel redeploy — the proxy route is baked in at build time.
- **Schema changes:** the API syncs the schema with `prisma db push` on start and refuses destructive changes. The committed migrations are behind the schema; creating a proper migration (`npx prisma migrate dev`) is recommended before real data lands.
- **Alternative API host:** `render.yaml` deploys the same API to Render instead; then the database must be made public on Coolify (with SSL and a firewall rule).
