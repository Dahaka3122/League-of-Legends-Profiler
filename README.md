# LoL Profiler

A League of Legends profile lookup (op.gg, leagueofgraphs, u.gg etc. styled), rebuilt in TypeScript.

## Setup

```bash
npm install
npm run typecheck   # tsc for server and client
npm test            # vitest for server and client
```

Get a development key at https://developer.riotgames.com (it expires every 24h) and put it in `server/.env`:

```
# Windows cmd: copy server\.env.example server\.env
# PowerShell / macOS / Linux: cp server/.env.example server/.env
```

Open `server/.env` and replace the placeholder with your key (`RIOT_API_KEY=RGAPI-...`). Then run in two terminals:

```bash
npm run dev:server   # http://localhost:3001
npm run dev:client   # http://localhost:5173
```

Search with a Riot ID like `Name#TAG`. The dev server proxies `/api/*` to the backend.

## Planned features
- Addind comments across the project
- Store matches in Postgres (Prisma), Redis cache, background fetching
- Advanced match history filtering
- Player comparison
- Ranked progression tracking
- Performance trends
- Player records and achievements
- Recent searches and adding profiles to favorite
- Light and dark theme

## Future ideas
- Revamped design
- Duo statistics
- Performance consistency analysis
- More advanced statistics
- Item build timeline
- Shareable profile URLs
- Automated CI pipeline
- API monitoring & diagnostics
- Demo mode
- Improved error handling

Note: Features and ideas are subject to change as development progresses. Historical statistics, such as LP progression and personal records, will depend on data collected and stored by the web application. Some features may also be limited by Riot Games API availability and policies.