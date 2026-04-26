# Agent Market

A Next.js demo for a Lightning-powered AI agent marketplace. Buyers describe a task in natural language, get **semantic search** over listed agents (Chroma + NVIDIA embeddings, optional LLM reranking), compare options, pay with **Alby / NWC / WebLN**, and go through a simulated run lifecycle with **settlement and refunds**. **Publishers** sign in, publish agents (market-hosted or self-hosted), and see basic revenue and run stats on the dashboard.

## Features

- **Semantic discovery** — Queries are embedded (NVIDIA API) and matched in a **Chroma** collection; results can be reranked with an NVIDIA chat model. If Chroma or NVIDIA is unavailable, search falls back to **lexical matching** over the same agent list.
- **Two sources of listings** — **Active agents in SQLite (Prisma)** from signed-in publishers, plus **built-in demo agents** in code for a full catalog without seeding the DB.
- **Accounts** — Email/password auth (session cookie, JWT via `AUTH_SECRET`). Sign up, sign in, **Account** and **Publisher dashboard** to create and manage agents.
- **Lightning payments** — Pay-per-run flow using the Bitcoin Connect / Alby stack (sats, invoice-style UX in the demo).
- **Static pages** — `How it works` and `About` explain pricing, refunds, and the marketplace model.

## Prerequisites

- **Node.js** (see `package.json` for the stack: Next 16, React 19, Prisma 6)
- **Docker** (optional but recommended) — to run Chroma locally

## Quick start

```bash
npm install
cp .env.example .env
# Set AUTH_SECRET (e.g. openssl rand -base64 32) and any keys below
npx prisma migrate dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create a user from `/signup` to use the publisher dashboard at `/dashboard`.

## Environment

Copy `.env.example` to `.env` and configure:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite URL, default `file:./prisma/dev.db` |
| `AUTH_SECRET` | **Required** for sessions — use a long random string |
| `NVIDIA_API_KEY` | **Required** for `npm run seed:chroma` and for full semantic + rerank search |
| `NVIDIA_API_BASE_URL` | Default NVIDIA integrate API base |
| `NVIDIA_EMBEDDING_MODEL` / `NVIDIA_SEARCH_MODEL` | Embedding and ranking models (defaults in `.env.example`) |
| `CHROMA_URL` | Chroma HTTP API, default `http://localhost:8000` |
| `CHROMA_COLLECTION` | Collection name for published/dummy agents, default `published_agents` |
| `CHROMA_API_KEY` | Only if your Chroma server requires a bearer token |
| `MARKET_DEBUG` | Set to `true` for extra server logs during development |

## Database (Prisma + SQLite)

Migrations live under `prisma/migrations/`. After cloning:

```bash
npx prisma migrate dev
```

This creates or updates `prisma/dev.db`. The file is gitignored; each developer (and CI) runs migrations locally.

## Chroma (vector store)

Run Chroma in Docker; data is stored under `./chroma-data` (gitignored). The app uses `CHROMA_URL` to connect:

```bash
docker run --rm -p 8000:8000 -v "$PWD/chroma-data:/chroma/chroma" chromadb/chroma
```

The app will connect to `http://localhost:8000` by default when `CHROMA_URL` is unset.

## Dummy / demo data (Chroma seed)

The script `scripts/seed-chroma.mjs` upserts a small set of **dummy agents** (e.g. math tutor, maps scraper, contract reviewer, GPU planner) with **real NVIDIA embeddings** so semantic search has something to retrieve beyond Prisma and static catalog agents.

1. Start Chroma (see above).
2. Set `NVIDIA_API_KEY` in `.env` (required by the script).
3. Run:

```bash
npm run seed:chroma
```

The script prints example queries you can try on the home page. Re-running the command **replaces/updates** the same agent IDs in the `CHROMA_COLLECTION` (upsert).

**Without** Chroma or NVIDIA, the home page still loads: built-in static agents in `lib/agents.ts` plus any **ACTIVE** rows from Prisma are used, and search errors fall back to **lexical** ranking.

## Useful scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run seed:chroma` | Seed Chroma with dummy agents (needs `NVIDIA_API_KEY` + Chroma) |

`postinstall` runs `prisma generate` so the Prisma client is available after `npm install`.

## Project layout (short)

- `app/` — Routes (marketplace, auth, dashboard, account, about, how-it-works)
- `components/` — UI (marketplace, auth, layout)
- `lib/` — DB, auth, search (`semantic-agent-search.ts`), payments, static agent catalog, NVIDIA/Chroma helpers
- `prisma/` — `schema.prisma` and SQL migrations
- `scripts/seed-chroma.mjs` — Chroma + NVIDIA embedding seed

For deeper Lightning and wallet behavior, see the Alby / NWC-oriented skill in `.agents/skills/alby-bitcoin-builder/` if present in your checkout.
