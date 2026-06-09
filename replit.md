# ClinicDesk

A full clinic management system for managing patients, appointments, medical records, prescriptions, and billing with role-based access and EN/AR language support.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/clinic-desk run dev` — run the frontend (port 22776, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run typecheck:libs` — rebuild lib declarations (run this first if lib/db schema changes)
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (artifacts/api-server, port 8080)
- Frontend: React + Vite + Wouter routing + TailwindCSS v4 (artifacts/clinic-desk, port 22776)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- UI components: shadcn/ui, lucide-react, recharts
- Charts: recharts
- Toast: sonner
- Date: date-fns

## Where things live

- `lib/db/src/schema/` — Drizzle DB schema (users, patients, appointments, visits, prescriptions, invoices, activity_log)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contract)
- `lib/api-client-react/src/generated/api.ts` — generated hooks (do not edit manually)
- `lib/api-client-react/src/custom-fetch.ts` — fetch utility with automatic Bearer token from `localStorage.clinic_token`
- `artifacts/api-server/src/routes/` — all Express 5 route handlers
- `artifacts/api-server/src/middlewares/authenticate.ts` — JWT auth middleware
- `artifacts/api-server/src/lib/auth.ts` — bcrypt + JWT helpers
- `artifacts/clinic-desk/src/contexts/AuthContext.tsx` — auth state (login/logout)
- `artifacts/clinic-desk/src/contexts/I18nContext.tsx` — EN/AR language switching (RTL support)
- `artifacts/clinic-desk/src/components/Layout.tsx` — sidebar layout with role-aware nav
- `artifacts/clinic-desk/src/pages/` — all pages (login, dashboard, patients, appointments, visits, prescriptions, invoices)
- `artifacts/clinic-desk/src/index.css` — teal/green medical theme (do not overwrite)

## Architecture decisions

- JWT stored in `localStorage` key `clinic_token`; custom-fetch auto-attaches as Bearer
- Role-based sidebar nav: admin/receptionist/doctor see different items; patients see limited views
- Contract-first API: OpenAPI spec → Orval codegen → typed hooks; backend validates with Zod schemas from drizzle-zod
- I18n: simple key-value dictionary with RTL flip via `document.documentElement.dir`
- No server-side sessions — stateless JWT with 7-day expiry

## Product

- Login with role-based access (admin, doctor, receptionist, patient)
- Dashboard with live stats, revenue bar chart, today's appointments table, recent activity feed
- Patient management: list/search, create, detail view with linked visits/prescriptions/invoices
- Appointment scheduling: list, weekly calendar view, status management, booking form
- Medical visits/records: create, view with full clinical notes
- Prescriptions: multi-medication form, printable detail view
- Billing/invoices: line-item builder, payment recording, status tracking
- EN/AR language toggle with RTL layout support

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@clinicdesk.com | admin123 |
| Doctor | doctor@clinicdesk.com | doctor123 |
| Receptionist | receptionist@clinicdesk.com | recept123 |

## Gotchas

- Always run `pnpm run typecheck:libs` before leaf package typechecks if you change `lib/db` schema
- Express 5: wildcard routes use `/{*splat}`, async handlers need `: Promise<void>` annotation
- Do NOT overwrite `artifacts/clinic-desk/src/index.css` — theme vars are set there
- Re-run codegen (`pnpm --filter @workspace/api-spec run codegen`) after any OpenAPI spec change

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
