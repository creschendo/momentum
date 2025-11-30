# Momentum — Full-stack modular starter (React + Vite + Express)

This repository is a minimal, modular full-stack starter focused on productivity features. It provides a structure to add independent feature modules (nutrition, fitness, productivity, etc.) where each module has a server router and a client UI piece.

What's included

- client — Vite + React frontend
- server — Express backend with modular routers

Quick start

1. From the repository root, install all dependencies (uses npm workspaces):

```powershell
npm install
```

2. Start both server and client in development (opens two processes):

```powershell
npm run dev
```

If you prefer separate terminals, run these instead:

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

This project is intentionally modular. Each feature area lives in a pair of locations:

- Server: `server/modules/<module>/index.js` — export an Express router and mount under `/api/<module>`.
- Client: `client/src/modules/<module>/index.jsx` — export module metadata used by the UI.

Three example modules are included:

- `nutrition` — server: `/api/nutrition/status`, client: Nutrition card
- `fitness` — server: `/api/fitness/status`, client: Fitness card
- `productivity` — server: `/api/productivity/status`, client: Productivity card

To add a new module:

1. Create `server/modules/<yourmodule>/index.js` and export an Express router.
2. Create `client/src/modules/<yourmodule>/index.jsx` exporting an object with `key`, `title`, and `description`.
3. Import the client module in `client/src/App.jsx` (or add dynamic loading) and add server routes under `/api/<yourmodule>`.

This structure keeps modules isolated and makes it easy to add features or swap implementations (e.g., replace a module with a microservice).

Contract (tiny)
- Inputs: HTTP requests from browser
- Outputs: JSON from server (GET /api/<module>/status) and React UI

Where to go next
- Add persistence (database) and authentication
- Add per-module tests and more endpoints (create/read/update/delete)
- Add TypeScript support if you prefer stricter typing

If you'd like, I can create a branch, commit these changes, and open a PR with the modular scaffolding and dependency updates.

Nutritionix integration

This project includes a small server-side wrapper for the Nutritionix API at `server/modules/nutrition/nutritionix.js`.

Setup

1. Sign up for Nutritionix and get your App ID and App Key: https://developer.nutritionix.com/
2. Create a `.env` file at the repo root (you can copy `.env.example`) and set:

```
NUTRITIONIX_APP_ID=your_app_id
NUTRITIONIX_API_KEY=your_api_key
```

3. Restart the server (if running) so environment variables are picked up.

How to use the Nutritionix wrapper (server-side)

Import the wrapper from the nutrition module and call methods. Example within `server/modules/nutrition/service.js` or a controller:

```js
import nutritionix from './nutritionix.js';

async function example() {
	// instant search for "banana"
	const instant = await nutritionix.searchInstant('banana');

	// natural language parse "2 eggs and a slice of bread"
	const parsed = await nutritionix.naturalLanguage('2 eggs and a slice of bread');
}
```

Notes

- The wrapper expects `NUTRITIONIX_APP_ID` and `NUTRITIONIX_API_KEY` in the environment. It will throw a helpful error if keys are missing.
- We intentionally added the wrapper but did not change service-level business logic; you can now call these helpers from `nutrition/service.js` when you want to enrich entries with nutrition facts.
- Do not commit your real `.env` file. Use `.env.example` as a template.
