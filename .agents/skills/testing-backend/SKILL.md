# Testing Zenless Tavern Backend

## Dev Server Setup

```bash
npm install
npm run dev  # Starts on port 3002
```

Health check: `curl http://localhost:3002/api/health` should return `{"status":"ok"}`

## Lint / Type Check

```bash
npx tsc --noEmit
```

No separate linter configured — TypeScript type checking is the only lint step (`npm run lint` runs `tsc --noEmit`).

## Testing Approach

All API endpoints are in `server.ts`. The backend is an Express server with in-memory state persisted to `data/state.json`.

### Endpoints Testable Without Credentials

- `GET /api/health` — health check
- `GET /api/settings` — returns current settings
- `PUT /api/settings` — update settings (Zod validated)
- `GET /api/characters` — list characters
- `POST /api/characters` — create character
- `GET /api/lorebooks` — list lorebooks
- `POST /api/models` — list models (can test SSRF blocking with private IPs)
- `POST /api/test-connection` — test AI provider connection
- `POST /api/interknot/:charId/sync` — sync chat history
- `GET /api/interknot/:charId` — get chat history
- `POST /api/hollow/sync` — sync hollow exploration history
- `GET /api/hollow/history` — get hollow history

### Endpoints Requiring External Credentials

- `POST /api/sync/validate` — requires a GitHub PAT with `gist` scope
- `POST /api/sync/up` — requires GitHub PAT (uploads to GitHub Gist)
- `POST /api/sync/down` — requires GitHub PAT (downloads from GitHub Gist)
- Chat endpoints (`/api/interknot/chat`, `/api/proxy/chat`, `/api/hollow/chat`) — require AI API key in settings to get real responses; without one they return mock responses

## Testing State Persistence

To test `loadPersistedState`, write a crafted `data/state.json` and restart the server. The server loads state on startup. Key fields in state.json:

- `interKnotHistories` — chat histories keyed by character ID
- `chatHistories` — legacy backward-compat field (only used in sync-down when `interKnotHistories` is absent)
- `characters`, `lorebooks`, `hollowHistory`, `proxyScenarios`, `settings`, `extensions`, `dbSettings`, `summaryDb`, `vectorDb`

## SSRF Testing

The server has SSRF protection via `isBlockedRemoteHost()` and `assertSafeOutboundUrl()`. To test:

```bash
# Should be blocked (OpenAI provider, private IP)
curl -X POST http://localhost:3002/api/models \
  -H 'Content-Type: application/json' \
  -d '{"provider":"OpenAI","url":"http://127.0.0.1","key":"test"}'
# Expected: 400 "Target host is blocked for security reasons"

# Should NOT be blocked (Custom provider, private IP allowed)
curl -X POST http://localhost:3002/api/models \
  -H 'Content-Type: application/json' \
  -d '{"provider":"Custom","url":"http://127.0.0.1"}'
# Expected: 500 connection error (not 400 SSRF block)
```

## Devin Secrets Needed

- `GITHUB_PAT_GIST` — GitHub Personal Access Token with `gist` scope (needed for sync endpoint testing)
- `GEMINI_API_KEY` or `OPENAI_API_KEY` — needed for testing real AI chat responses

## Notes

- No CI is configured for this repo
- The frontend is a React/Vite SPA served by the same Express server in dev mode
- Port 3002 is hardcoded in server.ts
- The server uses Zod schemas for all request validation — malformed payloads return 400 with detailed error messages
