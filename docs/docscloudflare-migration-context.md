# Third Place — Cloudflare Migration Context
*Prepared on: April 14, 2026*

---

## What Was Built

The app was built in Replit as a **pnpm monorepo** with TypeScript throughout. It is NOT a single-file app — it is structured across multiple workspace packages.

**Repo:** https://github.com/wombatlabs-dan/WFC
**Live Replit URL:** https://wfc-work-from-coffeehouse.replit.app/

### Monorepo Structure

```
WFC/
├── artifacts/
│   ├── api-server/       ← Express 5 backend (Node.js)
│   ├── third-place/      ← React + Vite frontend (the UI)
│   └── mockup-sandbox/   ← Throwaway; ignore
├── lib/
│   ├── db/               ← Drizzle ORM + database schema
│   ├── api-spec/         ← OpenAPI spec
│   ├── api-zod/          ← Zod validation schemas (generated from OpenAPI)
│   └── api-client-react/ ← React API hooks (generated from OpenAPI)
├── scripts/
├── package.json          ← Workspace root
├── pnpm-workspace.yaml
└── replit.md             ← Architecture notes written by Replit
```

### Tech Stack (as built)

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript + shadcn/ui components |
| Backend | Express 5, Node.js 24, TypeScript |
| Database | **PostgreSQL** (via Replit's provisioned Postgres) |
| ORM | Drizzle ORM with `pg` driver |
| Validation | Zod v4 + drizzle-zod |
| API codegen | Orval (generates client hooks + Zod schemas from OpenAPI spec) |
| Package manager | pnpm workspaces |

---

## ⚠️ The Critical Migration Issue

**The app was built on PostgreSQL. The original PRD specified Cloudflare D1 (SQLite).**

Replit provisioned a PostgreSQL database by default. This matters because:

- **Cloudflare D1 is SQLite**, not PostgreSQL. They are different dialects.
- The Drizzle ORM config uses `dialect: "postgresql"` and the `pg` driver.
- Drizzle *does* support both dialects, but the schema and driver need to be swapped.
- The migration is a database swap, not just a deployment move.

**Options at migration time:**

1. **Swap D1 for Neon (Recommended for fastest path):** Neon is a serverless PostgreSQL provider with a free tier and a Cloudflare Workers-compatible driver (`@neondatabase/serverless`). No schema changes needed — just swap the connection string. Cloudflare Workers can call Neon over HTTP. This is the path of least resistance.

2. **Migrate to Cloudflare D1 (Original plan):** Requires changing the Drizzle dialect from `postgresql` to `sqlite`, updating the schema file, switching the driver from `pg` to Cloudflare's D1 binding, and re-running migrations. More work but keeps everything within Cloudflare's ecosystem and free tier.

3. **Keep PostgreSQL via Replit's DB:** Not recommended for production — ties the app to Replit's infrastructure forever.

**Recommendation:** Go with **Option 1 (Neon)** for the migration session. It's the fastest path to a working Cloudflare deployment without rewriting the data layer. You can always migrate to D1 later if you want everything under Cloudflare.

---

## What the Migration Involves

### Frontend (artifacts/third-place)
- Vite + React app → deploy as **Cloudflare Pages**
- Cloudflare Pages has native GitHub integration — connect the repo, point it at `artifacts/third-place`, set the build command and output directory
- Build command: `pnpm build` (from the third-place package)
- Output directory: `dist/`
- This is the easy part.

### Backend (artifacts/api-server)
- Express 5 app → needs to become a **Cloudflare Worker**
- Express doesn't run natively on Cloudflare Workers (Workers use the Fetch API, not Node.js HTTP)
- **Two options:**
  - **Hono (Recommended):** Lightweight framework designed for Cloudflare Workers, very similar API to Express. Rewriting Express routes to Hono is straightforward.
  - **@cloudflare/workers-nodejs-compat:** Cloudflare has a Node.js compatibility flag that lets some Node apps run on Workers. Express 5 may work with this, but it's experimental.

### Database
- As described above — swap `pg` + Replit Postgres for either Neon (serverless Postgres) or Cloudflare D1 (SQLite).

### Environment Variables
- `DATABASE_URL` currently points to Replit's Postgres instance
- Will need to be updated to Neon connection string (or replaced with D1 binding)
- Store in Cloudflare Workers secrets / Cloudflare Pages environment variables

---

## Cloudflare Account Details

- **Cloudflare account:** Connected via the Cloudflare MCP in Cowork
- **Existing Workers:** Can be listed via `workers_list` MCP tool
- **Existing D1 databases:** Can be listed via `d1_databases_list` MCP tool
- The migration session can use the Cloudflare MCP to create Workers, D1 databases, and KV namespaces directly without leaving Claude

---

## Files in This Session's Scratch Folder

All planning artifacts from the April 14, 2026 session are at:
`scratch/2026-04-14-wfch/`

| File | Contents |
|---|---|
| `wfch-sf-list.md` | Master list of 35 SF venues (seed data) |
| `wfch-app-one-pager.md` | Product one-pager |
| `third-place-PRD.md` | Full planning PRD |
| `third-place-replit-prompt.md` | The build prompt used in Replit |
| `cloudflare-migration-context.md` | This file |
| `cloudflare-migration-kickoff.md` | Kickoff prompt for next session |

---

## Key Decisions Already Made

- **Name:** WFC
- **Single user:** Dan Harrison only (no auth for v1)
- **SF only:** v1 is San Francisco-scoped
- **No Combo Mode:** Geo-proximity pairing deferred to v2
- **Three randomizer modes:** Coffee Only / Coffee + Food / Lunch Spot
- **PWA:** Must install to iPhone home screen
- **Auth plan:** Cloudflare Access (Google login at infrastructure layer) before any public sharing — no app-level auth code needed
- **Scheduled jobs:** Weekly cron for discovery (Brave Search API) and validation (Google Places API)
