# Momentum — Full-stack modular starter (React + Vite + Express)

Lightweight modular dashboard combining nutrition, fitness, productivity, and a pomodoro timer. The repo uses an explicit module pattern: each feature exposes a server router and a client UI module.

What's included

- `client` — Vite + React frontend
- `server` — Express backend with modular routers and PostgreSQL persistence

Quick start

1. From the repository root, install dependencies (npm workspaces):

```powershell
npm install
```

2. Run both client and server in development:

```powershell
npm run dev
```

If you prefer separate terminals:

```powershell
npm --prefix server run dev
npm --prefix client run dev
```

Production build + serve

```powershell
# build the client
npm --prefix client run build

# start the server which will serve the built client
npm --prefix server run start
```

Modular architecture

Each feature is split across client and server:

- Server: `server/modules/<module>/index.js` exports an Express router mounted at `/api/<module>`.
- Client: `client/src/modules/<module>/` contains UI, hooks, and module registration used by the dashboard.

Example modules

- `nutrition` — water, foods, meals, weight tracking, BMR/TDEE
- `fitness` — splits, days, lifts, cardio
- `productivity` — tasks and calendar events

To add a module:

1. Add `server/modules/<yourmodule>/index.js` (router) and `service.js` (logic + DB access).
2. Add `client/src/modules/<yourmodule>/` with a root component and hooks.
3. Add a client API wrapper under `client/src/api/` and mount the server route in `server/index.js`.

Authentication

This project uses cookie-based session auth. Run the setup helper to create DB schema + a seeded user:

```powershell
npm run auth:setup
```

Manual auth/database setup:

1. Apply the DB schema:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d momentum -f server/schema.sql
```

2. Seed a test user:

```powershell
npm --prefix server run seed:user
```

3. Start server and client:

```powershell
npm --prefix server run dev
npm --prefix client run dev
```

Notes:

- Protected module APIs require auth: `/api/nutrition`, `/api/fitness`, `/api/productivity`.
- Auth endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.

Nutrition external API

The server uses CalorieNinjas for food search/metadata. Configure via environment variable:

```text
CALORIENINJAS_API_KEY=your_api_key
```

The CalorieNinjas wrapper lives at `server/modules/nutrition/calorieninjas.js` and maps results into the app's expected fields.

Runtime overview

- Client hooks call functions in `client/src/api/*` which fetch `/api/*` endpoints.
- Server routes validate input and call `service.js` functions in each module to interact with Postgres via `server/db.js`.
- Protected routes use middleware `requireAuth` to resolve `req.user` from session cookies.

Local scripts

- `npm run dev` — runs client + server concurrently
- `npm --prefix server run dev` — server only (nodemon)
- `npm --prefix client run dev` — client only (vite)
- `npm run start` — start server (serves built client if present)
- `npm run db:init` (root forwards to `server`) — applies `server/schema.sql`
- `npm run seed:user` (root forwards to `server`) — seed test user

Where to go next

- Add stricter per-module user isolation if you expect multi-tenant data (some tables are already user-scoped; others are global in the schema).
- Add tests for API contracts in `server/modules/*/__tests__`.
- Consider a lightweight migration tool if you plan frequent schema changes.

If you want, I can commit this README update and open a PR. 
