---
name: ClinicDesk architecture
description: Key decisions and gotchas for the ClinicDesk clinic management system
---

## Auth
- JWT stored in `localStorage` key `clinic_token`
- `lib/api-client-react/src/custom-fetch.ts` auto-attaches as `Authorization: Bearer` — no extra setup needed
- 7-day token expiry, stateless, no server sessions

## Lib rebuild rule
- **Always run `pnpm run typecheck:libs` before running leaf package typechecks** if any `lib/db` schema was changed
- Missing exports from `@workspace/db` usually mean stale declarations, not bad imports

## Express 5 quirks
- Wildcard routes: `/{*splat}` (not `/*`)
- Async handlers must be annotated `: Promise<void>`
- Parse route params with `parseInt(raw, 10)` — they come as strings

## Frontend
- Routing: wouter (not react-router)
- Theme: teal/green medical palette set in `artifacts/clinic-desk/src/index.css` — do NOT overwrite
- Charts: recharts
- Toast: sonner (not shadcn toast)
- Language: I18nContext with EN/AR dictionary + RTL via `document.documentElement.dir`

**Why:** These details are non-obvious and caused issues during initial build.
