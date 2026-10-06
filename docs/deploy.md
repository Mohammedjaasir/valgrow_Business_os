# Deploying ValGrow Business OS

**Web** → Vercel · **API** → Render · **Database** → Neon (Postgres)

The browser only ever talks to the Vercel domain. Requests to `/api/*` are forwarded by Vercel to the Render API, so login cookies stay first-party and no CORS/cookie changes are needed in the backend.

```
Browser ──► https://<app>.vercel.app ──/api/*──► https://valgrow-api.onrender.com ──► Neon Postgres
```

Do the steps in this order — each one needs a value from the previous.

## 1. Database — Neon (≈2 min)

1. Sign in at https://neon.tech → **New project** (region close to your users, e.g. *Asia Pacific (Singapore)*).
2. Open **Connection details**, turn **Connection pooling off**, and copy the connection string. It looks like
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`

## 2. API — Render (≈5 min)

1. Sign in at https://dashboard.render.com with GitHub → **New → Blueprint**.
2. Pick the `ValGrow-Labs/valgrow_Business_os` repo. Render reads `render.yaml` and proposes the `valgrow-api` service.
3. Fill in the two prompted values:
   - `DATABASE_URL` — the Neon string from step 1
   - `WEB_URL` — put `https://placeholder.vercel.app` for now (you'll update it in step 5)
4. **Apply**. The first deploy takes a few minutes; on start it creates the tables (`prisma db push`).
5. When it shows **Live**, open `https://valgrow-api.onrender.com/health` (use your service's URL) — you should see a JSON health response. Copy the service URL.

## 3. Seed the database (once, from your machine)

From the repo root, with the Neon string:

```bash
DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" npm run seed
```

This creates the demo organization, users, products and chart of accounts. The seeded login is `alex.verma@valgrow.dev` / `DevelopmentPass123!` — **change that password before sharing the URL.**

## 4. Web — Vercel (≈3 min)

1. Go to https://vercel.com/new → **Import** `ValGrow-Labs/valgrow_Business_os`.
2. **Root Directory:** `apps/web` (click *Edit*). Leave Framework Preset as *Other*; build settings come from `apps/web/vercel.json`.
3. **Environment Variables** (Production):

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | `/api` |
   | `API_PROXY_TARGET` | your Render URL, e.g. `https://valgrow-api.onrender.com` |
   | `NITRO_PRESET` | `vercel` |

4. **Deploy**. Copy the production URL (e.g. `https://valgrow-business-os.vercel.app`).

## 5. Connect them

1. In Render → `valgrow-api` → **Environment**, set `WEB_URL` to the exact Vercel URL from step 4 (no trailing slash) → **Save, rebuild and deploy**.
2. Open the Vercel URL and sign in.

From now on, every push to `main` redeploys both the web app (Vercel) and the API (Render).

## Good to know

- **Render free plan sleeps** after 15 minutes idle; the first request after that takes ~30–60 s. Upgrade the plan to keep it always on.
- **Preview deployments** (Vercel branch/PR URLs) are blocked by the API's CORS rule, which allows only `WEB_URL`. Production works; to test previews, temporarily set `WEB_URL` to the preview URL.
- **Changing `API_PROXY_TARGET`** requires a Vercel redeploy — the proxy route is baked in at build time.
- **Schema changes:** the API syncs the schema with `prisma db push` on start and refuses destructive changes. The committed migrations are behind the schema; creating a proper migration (`npx prisma migrate dev`) is recommended before real data lands.
- **Custom domain:** add it in Vercel → Domains, then update `WEB_URL` on Render to match.
