# ClinicDesk — Missing Features Implementation Guide

A step-by-step guide to bring the project in line with the full requirements.

---

## Phase 1: Seed Data (Immediate Demo Value)

**Goal:** Populate the DB with realistic sample data so the system is usable on startup.

**Files to modify:**
- `lib/db/src/seed.ts`

**Steps:**

1. Add sample patients (at least 6–8) with varied gender, blood types, allergies
2. Add sample appointments across doctors, including some for today (so dashboard shows data)
3. Add sample visits linked to some appointments
4. Add sample prescriptions with 2–3 medications each
5. Add sample invoices (some paid, some pending, some partial)
6. Add sample activity log entries

**Key considerations:**
- Use hardcoded `doctorId` = 2 (Dr. Smith from seed), `receptionistId` = 3
- Hash passwords with `bcryptjs` or use pre-computed hashes
- Make the script idempotent (check existence before inserting)
- Run with `pnpm run db:seed`

---

## Phase 2: Missing UI Pages

### 2.1 Appointment Detail Page

**New file:** `artifacts/clinic-desk/src/pages/appointments/detail.tsx`

**Steps:**
1. Create page route `GET /appointments/:id` (backend exists, frontend page missing)
2. Fetch appointment by ID using the generated hook
3. Display: patient name, doctor name, date/time, duration, type, status, notes
4. Add inline status change dropdown
5. Add action buttons: "Edit", "Cancel appointment", "Start visit" (if status is confirmed)
6. Link from the weekly calendar and list view already points here

### 2.2 Edit Pages

**New files:**
- `artifacts/clinic-desk/src/pages/patients/edit.tsx`
- `artifacts/clinic-desk/src/pages/appointments/edit.tsx`
- `artifacts/clinic-desk/src/pages/visits/edit.tsx`
- `artifacts/clinic-desk/src/pages/prescriptions/edit.tsx`
- `artifacts/clinic-desk/src/pages/invoices/edit.tsx`

**Pattern** (for each):
1. Reuse the "new" form component, pre-populate with existing data
2. Fetch existing entity by ID
3. Use the `PATCH` endpoint on submit
4. Add "Edit" button on the detail page that links to `/entity/:id/edit`

### 2.3 Guest Landing Page

**New file:** `artifacts/clinic-desk/src/pages/landing.tsx`

**Steps:**
1. Create a public-facing landing page: clinic name, services overview, doctor profiles, contact info
2. Add "Book Appointment" CTA that redirects to login (or registration in Phase 3)
3. Update `App.tsx` routing so `/` shows landing page for unauthenticated users
4. Add a "Login" button in the header

**Backend work:**
- Add a `GET /doctors` public endpoint (or make existing patients route public for doctor listing)
- Add a `GET /clinic/info` endpoint (can return static config from env or DB)

### 2.4 Patient Portal View

**New file:** `artifacts/clinic-desk/src/pages/my-records.tsx` (or similar)

**Steps:**
1. Create a patient-specific view showing only THEIR appointments, prescriptions, invoices
2. Filter by `req.userId` via `patientId` lookup (assuming patient user has linked patient record)
3. Add navigation link for patient role in the sidebar

**Backend work:**
- Add `GET /patients/by-user/:userId` or use existing endpoints with patient filter
- Ensure patient users can only read their own data

### 2.5 Staff & User Management (Admin)

**New file:** `artifacts/clinic-desk/src/pages/staff/index.tsx`

**Steps:**
1. List all users with their roles
2. Add "Create Staff" form (name, email, password, role)
3. Edit staff details
4. Deactivate/delete staff accounts

**Backend work:**
- Add `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` endpoints
- These should be admin-only

### 2.6 Clinic Settings Page

**New file:** `artifacts/clinic-desk/src/pages/settings.tsx`

**Steps:**
1. Create form for: clinic name, address, phone, working hours, consultation pricing
2. Store in a `clinic_settings` table or env vars
3. Admin-only access

**Backend work:**
- Create `clinic_settings` schema table or use a JSON config
- Add `GET /settings`, `PUT /settings` endpoints

---

## Phase 3: Patient Self-Registration

**Goal:** Allow patients to sign up without staff intervention.

**Files to modify:**
- `artifacts/clinic-desk/src/pages/login.tsx` — add "Create Account" link
- `artifacts/clinic-desk/src/pages/register.tsx` — new file

**Steps:**
1. Create a registration page: name, email, phone, password, confirm password
2. On submit, call `POST /auth/register` with role = "patient"
3. Auto-create a linked patient record OR add a `userId` column to patients table
4. Auto-login after successful registration
5. Add a link on the login page: "Don't have an account? Register here"

**Backend work:**
- Modify `POST /auth/register` to auto-create a patient record when role = "patient"
- Add `userId` foreign key to `patients` table (or create a one-to-one relationship)

---

## Phase 4: Notifications & Reminders

### 4.1 In-App Notification System

**New schema file:** `lib/db/src/schema/notifications.ts`

**Schema:**
```ts
notifications {
  id: serial PK
  userId: integer NOT NULL (FK to users)
  type: text NOT NULL (appointment_reminder / payment_alert / follow_up / etc.)
  title: text NOT NULL
  message: text NOT NULL
  read: boolean DEFAULT false
  entityType: text nullable (appointment / invoice / visit)
  entityId: integer nullable
  createdAt: timestamp with tz DEFAULT now()
}
```

**Backend work:**
- Add `GET /notifications` (list user's notifications, newest first)
- Add `PATCH /notifications/:id/read` (mark as read)
- Add `GET /notifications/unread-count`

**Frontend work:**
- Add a notification bell icon in the Layout header (top-right or sidebar)
- Dropdown shows recent unread notifications
- Mark as read on click
- Badge showing unread count

### 4.2 Appointment Reminder Logic

**New file:** Add a cron/scheduler to `artifacts/api-server/src/`

**Steps:**
1. Add `node-cron` dependency
2. Create a scheduled job that runs every hour
3. Query appointments scheduled for the next 24 hours
4. Create notification records for each (user ID = patient's linked user)
5. Optionally: log activity entries

### 4.3 Follow-Up Reminders

**Steps:**
1. When a visit is created with a `followUpDate`, auto-create a notification
2. Cron job checks visits with follow-up dates approaching

---

## Phase 5: Reports & Analytics Page

**New file:** `artifacts/clinic-desk/src/pages/reports.tsx`

**Steps:**
1. Create a reports page with tabbed sections:
   - **Financial Report:** Revenue by month (with date range picker), paid vs pending breakdown
   - **Patient Report:** New patients over time, total patients, gender/age distribution
   - **Appointment Report:** Appointments by status, by doctor, cancellation rate
   - **Clinical Report:** Most common diagnoses, prescriptions trends
2. Add date range filter component (start/end date pickers)
3. Add export buttons: Download as CSV, PDF

**Backend work:**
- `GET /reports/revenue?from=&to=` — revenue within date range with daily/monthly grouping
- `GET /reports/patients?from=&to=` — patient registration stats
- `GET /reports/appointments?from=&to=&doctorId=` — appointment metrics
- `GET /reports/diagnoses?from=&to=` — top diagnoses
- `GET /reports/prescriptions?from=&to=` — most prescribed medications

---

## Phase 6: Calendar Enhancements

### 6.1 Daily Calendar View

**Modify:** `artifacts/clinic-desk/src/pages/appointments/index.tsx`

**Steps:**
1. Add a third view toggle: List | Day | Week
2. Day view: single column with hourly slots 8:00–19:00
3. Clicking a time slot opens the "New Appointment" form with date/time pre-filled

### 6.2 Month Calendar View

**Steps:**
1. Use the existing `calendar.tsx` shadcn component (react-day-picker)
2. Show dot indicators on days that have appointments
3. Clicking a day switches to day view for that date

### 6.3 Doctor Filter on Calendar

**Steps:**
1. Add a doctor dropdown filter in the appointments page header
2. Calendar/list view filters by selected doctor
3. Default: show all doctors

---

## Phase 7: File Upload Support

**Dependencies:**
- Add `multer` to `artifacts/api-server/package.json`

**Backend work:**
1. Add `uploads/` directory (gitignored but created on start)
2. Create `GET /uploads/:filename` endpoint to serve static files
3. Modify `POST /visits` to accept file attachments in `multipart/form-data`
4. Add `attachments` column (jsonb array of `{filename, originalName, uploadedAt}`) to visits table
5. OR create a separate `visit_attachments` table

**Frontend work:**
1. Add file upload input to the visit creation form
2. Display uploaded files on the visit detail page with download links
3. Accept: PDF, images (lab reports, scan results)

---

## Phase 8: Security Hardening

### 8.1 Role-Based Access Control (RBAC)

**New file:** `artifacts/api-server/src/middlewares/authorize.ts`

**Steps:**
```ts
// authorize.ts
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res, next) => {
    if (!allowedRoles.includes(req.userRole!)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}
```

**Apply to routes:**
- Admin-only: dashboard stats, user management, settings
- Doctor+Receptionist: patient CRUD
- Doctor: visits, prescriptions
- Receptionist+Admin: invoices
- All authenticated: own profile, own appointments

### 8.2 Rate Limiting

**Dependencies:**
- Add `express-rate-limit` to `artifacts/api-server/package.json`

**Steps:**
1. Apply strict rate limit on `/auth/login`: max 10 attempts per 15 minutes per IP
2. Apply moderate rate limit on all other routes: max 100 requests per minute

### 8.3 JWT Security

**Steps:**
1. Move JWT from `localStorage` to `httpOnly` cookie
2. Add CSRF protection
3. Reduce token expiry from 7 days to 24 hours (with refresh token rotation)
4. Add token blacklist for server-side logout invalidation

### 8.4 DB Foreign Key Constraints

**Modify:** `lib/db/src/schema/*.ts`

**Steps:**
1. Add `.references(() => patientsTable.id)` to all `patientId` columns
2. Add `.references(() => usersTable.id)` to all `doctorId` / `userId` columns
3. Add `onDelete: "cascade"` or `"set null"` as appropriate
4. Run `pnpm run db:push` to sync

---

## Phase 9: Database Migrations

**Goal:** Replace `drizzle-kit push` with versioned migrations.

**Steps:**
1. Add `drizzle.config.ts` with `out: "./migrations"` output directory
2. Run `drizzle-kit generate` to create initial migration files
3. Create `pnpm run db:migrate` script
4. Commit migration files to version control
5. Update `replit.md` instructions

---

## Execution Order (Recommended)

| Phase | Effort | Value | When |
|---|---|---|---|
| **1 — Seed Data** | Low | High | Now |
| **2.1 — Appointment Detail** | Low | High | Now |
| **2.2 — Edit Pages** | Medium | High | Next |
| **8.1 — RBAC** | Low | Critical | Next |
| **2.3 — Guest Landing** | Medium | Medium | Soon |
| **3 — Self-Registration** | Medium | High | Soon |
| **4 — Notifications** | High | Medium | Later |
| **5 — Reports** | High | Medium | Later |
| **6 — Calendar** | Medium | Low | Later |
| **7 — File Uploads** | Medium | Medium | Later |
| **8.2-8.4 — Security** | Medium | Critical | Ongoing |

---

## Quick Wins (Do These First)

1. **Extend `seed.ts`** with patients, appointments, visits, prescriptions, invoices
2. **Create `appointments/detail.tsx`** page (backend endpoint already exists)
3. **Add RBAC middleware** (`authorize.ts`) to secure existing endpoints
4. **Add "Create Account" link** to login page + basic registration flow
