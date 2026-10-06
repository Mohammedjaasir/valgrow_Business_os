# Deploying ValGrow Business OS

**Web** → Vercel · **API** → Render · **Database** → PostgreSQL on your Coolify server

The browser only ever talks to the Vercel domain. Requests to `/api/*` are forwarded by Vercel to the Render API, so login cookies stay first-party and no CORS/cookie changes are needed in the backend.

```
Browser ──► https://<app>.vercel.app ──/api/*──► https://valgrow-api.onrender.com ──► Postgres on Coolify (your VPS)
```

Do the steps in this order — each one needs a value from the previous.

## 1. Database — PostgreSQL on Coolify (≈5 min)

1. In Coolify open your project → **+ New** → **Database** → **PostgreSQL** (version 16) and pick your server.
2. Set **Username**, **Password** (long, random) and **Initial database** = `valgrow`. Start it.
3. Enable **SSL** in the database's settings (Coolify can generate the certificate), so data isn't sent in plain text over the internet.
4. Turn on **Make it publicly available** and choose a **Public port** (e.g. `5432`). Render runs outside your server, so it needs this.
5. **Lock the port down** on the VPS firewall: allow the public port only from Render's outbound IP addresses (Render dashboard → your service → **Connect** → *Outbound* — shown after step 2 below) and your own IP for seeding. Example with `ufw`:
   ```bash
   sudo ufw allow from <render-outbound-ip> to any port 5432 proto tcp
   sudo ufw allow from <your-ip> to any port 5432 proto tcp
   ```
6. Copy the **Postgres URL (public)** from Coolify and add `?sslmode=require` at the end. It looks like
   `postgresql://valgrow_user:<password>@<server-ip>:5432/valgrow?sslmode=require`
7. Set up **Scheduled backups** (database → *Backups*) to S3-compatible storage — Coolify doesn't back up off-server by default.

> Tip: if your Coolify server can host Node apps, you can run the API there too (same server, private network, no public database port, no Render sleep). Ask and the setup can be switched to API-on-Coolify.

## 2. API — Render (≈5 min)

1. Sign in at https://dashboard.render.com with GitHub → **New → Blueprint**.
2. Pick the `ValGrow-Labs/valgrow_Business_os` repo. Render reads `render.yaml` and proposes the `valgrow-api` service.
3. Fill in the two prompted values:
   - `DATABASE_URL` — the Coolify Postgres URL from step 1
   - `WEB_URL` — put `https://placeholder.vercel.app` for now (you'll update it in step 5)
4. **Apply**. The first deploy takes a few minutes; on start it creates the tables (`prisma db push`).
5. When it shows **Live**, open `https://valgrow-api.onrender.com/health` (use your service's URL) — you should see a JSON health response. Copy the service URL.

## 3. Seed the database (once, from your machine)

From the repo root, with the Coolify Postgres URL (your IP must be allowed by the firewall rule from step 1):

```bash
DATABASE_URL="postgresql://valgrow_user:<password>@<server-ip>:5432/valgrow?sslmode=require" npm run seed
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

- **Database security:** keep the public port firewalled to Render + your IP, use a long password, and keep SSL on.
- **Render free plan sleeps** after 15 minutes idle; the first request after that takes ~30–60 s. Upgrade the plan to keep it always on.
- **Preview deployments** (Vercel branch/PR URLs) are blocked by the API's CORS rule, which allows only `WEB_URL`. Production works; to test previews, temporarily set `WEB_URL` to the preview URL.
- **Changing `API_PROXY_TARGET`** requires a Vercel redeploy — the proxy route is baked in at build time.
- **Schema changes:** the API syncs the schema with `prisma db push` on start and refuses destructive changes. The committed migrations are behind the schema; creating a proper migration (`npx prisma migrate dev`) is recommended before real data lands.
- **Custom domain:** add it in Vercel → Domains, then update `WEB_URL` on Render to match.
