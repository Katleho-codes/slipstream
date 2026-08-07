# SlipStream

Digital payslip & pay history platform for South African employers.

## Architecture

```
                      ┌─────────────┐
   Internet ────────▶ │   proxy     │  (Caddy — only container with published ports)
                      │  80 / 443   │
                      └──────┬──────┘
                             │  public network
                 ┌───────────┴───────────┐
                 ▼                       ▼
          ┌─────────────┐        ┌─────────────┐
          │  frontend   │        │     api     │
          │  (Next.js)  │        │ (Express/TS)│
          └─────────────┘        └──────┬──────┘
                                         │  db-internal network
                                         ▼
                                  ┌─────────────┐
                                  │     db      │
                                  │ (Postgres)  │
                                  └─────────────┘
```

- **proxy** is the only container with `ports:` published to the host. It terminates
  TLS and routes `/api/*` to the backend, everything else to the frontend.
- **api** and **db** publish no ports at all — they are reachable only by other
  containers on their Docker network, never from the host or the internet.
- **db** sits on a network (`db-internal`) shared only with `api` — the frontend
  and proxy have no path to Postgres even if compromised.

| Layer    | Stack                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend  | Node.js + Express + TypeScript, Prisma + PostgreSQL, Better Auth, Zod v4, Resend, Puppeteer (SARS-compliant PDF generation + HMAC QR tokens) |
| Frontend | Next.js dashboard                                                                                                                            |
| Database | PostgreSQL 16                                                                                                                                |
| Proxy    | Caddy (automatic HTTPS)                                                                                                                      |

Timezone is pinned to `Africa/Johannesburg` throughout.

## Repository layout

```
.
├── backend/
│   ├── Dockerfile
│   ├── prisma/
│   ├── src/
│   └── package.json
├── frontend/
│   ├── Dockerfile
│   └── ...
├── docker-compose.yml
├── Caddyfile
├── .env.example
└── README.md
```

## Local development (no Docker)

Backend:

```bash
cd backend
npm ci
cp .env.example .env      # fill in a local DATABASE_URL, etc.
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Frontend:

```bash
cd frontend
npm ci
npm run dev
```

## Running the full stack with Docker

1. Copy `.env.example` to `.env` in the project root and fill in real values.
   This file is only used to populate `docker-compose.yml` — it is never baked
   into any image.
2. Point `Caddyfile` at your real domain (replace `yourdomain.com`).
3. Ensure `frontend/next.config.js` has `output: "standalone"` set — the
   frontend Dockerfile depends on this build mode.
4. Build and start everything:

    ```bash
    docker compose up -d --build
    ```

5. Run migrations against the running `db` container (this is deliberately
   **not** part of the Docker build — migrations need a live database, which
   doesn't exist at build time):

    ```bash
    docker compose exec api npx prisma migrate deploy
    ```

Only `proxy` is reachable from outside the host. `api` and `db` have no
published ports — this is enforced by omitting `ports:` for those services
in `docker-compose.yml`, not just by firewall rules, so it holds even on a
host with no other network protection.

## Secrets

Secrets (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, etc.) are:

- **Never** written into a Dockerfile as `ENV`/`ARG` — that would bake them
  into image layers.
- Supplied at **container runtime only**, via `docker-compose.yml`'s
  `environment:` block, sourced from the root `.env` file (kept out of git)
  or your host's secret manager.
- In CI/CD, stored as GitHub Actions secrets and only used at the deploy
  step (e.g. writing the remote `.env` or calling a PaaS API) — never
  during `docker build`.

`prisma generate` (run inside the backend Dockerfile's build stage) only
reads `schema.prisma` — it does not need `DATABASE_URL` at build time.

## Puppeteer in Docker

The backend's PDF generation uses Puppeteer. Rather than let Puppeteer
download its own Chromium (large image, flaky in minimal base images), the
backend Dockerfile installs Chromium via Alpine's package manager and points
Puppeteer at it with `PUPPETEER_SKIP_DOWNLOAD` and
`PUPPETEER_EXECUTABLE_PATH`.

## CI/CD

`.github/workflows/backend.yml` runs on any push touching `backend/**`:

1. Checkout
2. `npm ci`
3. `npx prisma format --check`
4. `npm test` (Vitest)

A build-and-push job (and equivalent frontend workflow) can be added after
tests pass, tagging images with the commit SHA and pushing to your registry.
Deployment (pulling the new image and running `prisma migrate deploy`) is a
separate step from the image build, since it needs the runtime secrets that
the build itself never sees.

## Billing

Subscription tiers: R199 / R499 / R999 per month, framed around BCEA
compliance. PayFast ITN webhooks handle billing events.
