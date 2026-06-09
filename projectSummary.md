# ClinicDesk Project Summary & Guide

Welcome to the comprehensive guide for **ClinicDesk**, the advanced, role-based Clinic Management System built throughout this conversation.

---

## 🏗️ Architecture & Technology Stack

ClinicDesk is structured as a **Turborepo** monorepo to cleanly separate concerns while maintaining strong type safety across the stack.

### 📦 Workspaces
1. **`@workspace/db`**: Database schema definition and migration logic using **Drizzle ORM** and **PostgreSQL**.
2. **`@workspace/api-server`**: Express.js backend serving the REST API.
3. **`@workspace/api-client-react`**: Auto-generated React Query hooks and Zod schemas (using **Orval** from `openapi.yaml`).
4. **`@workspace/clinic-desk`**: The frontend React SPA (Vite + Wouter + TailwindCSS + Recharts).

### 🛠️ Key Technologies
*   **Backend**: Node.js, Express, Drizzle ORM, Drizzle-Zod, Multer (File Uploads), Express-Rate-Limit, PASETO (Platform-Agnostic Security Tokens) for Auth.
*   **Frontend**: React, Vite, Wouter (Routing), TanStack Query (Data Fetching), TailwindCSS, Lucide React (Icons), Recharts (Analytics), Sonner (Toast Notifications).
*   **API Design**: API-First approach driven by an `openapi.yaml` specification.

---

## 🚀 How to Run the Application

Follow these steps to run the complete environment from scratch:

### 1. Prerequisites
Ensure you have installed:
*   Node.js (v20+)
*   PNPM (Package Manager)
*   Docker (for running PostgreSQL)

### 2. Setup the Database
Start a local PostgreSQL instance via Docker:
```bash
docker run --name clinic-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=clinic_db -p 5432:5432 -d postgres
```
Ensure your `.env` file at the root has the correct connection string:
```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/clinic_db
```

### 3. Install & Initialize
Install all workspace dependencies:
```bash
pnpm install
```

Push the Drizzle Schema to the Database (creates tables and foreign keys):
```bash
pnpm -w run db:push
```

*(Optional)* Seed the database with initial users and data:
```bash
# Seed script execution (if configured)
node ./artifacts/api-server/seed.js
```

### 4. Start the Application
Run the entire monorepo in parallel:
```bash
pnpm dev
```
*   **Frontend (ClinicDesk)** will run at: `http://localhost:5173`
*   **Backend (API Server)** will run at: `http://localhost:8080`

---

## 🛡️ Role-Based Workflows & Flows

ClinicDesk relies on a strict 4-tier Role-Based Access Control (RBAC) system.

### 1. Admin Role
*The omnipotent system administrator.*
*   **Access**: Complete access to all system modules and endpoints.
*   **Flows**:
    *   **Staff Management**: Create, edit, and delete user accounts (Doctors, Receptionists).
    *   **Analytics**: View the comprehensive Reports Dashboard (`/reports`) containing revenue metrics, patient counts, and chart visualizations.
    *   **Settings**: Configure global Clinic Settings (business hours, contact info).

### 2. Receptionist Role
*The front-desk operations manager.*
*   **Access**: Scheduling, Patient Intake, and Billing.
*   **Flows**:
    *   **Patient Intake**: Register new patients into the system.
    *   **Scheduling**: Book, confirm, or cancel appointments across all doctors.
    *   **Invoicing**: Generate invoices for completed visits and record partial or full cash/card payments. Can print beautiful, styled PDF invoices.
    *   **Notifications**: Receives alerts for newly booked online appointments.

### 3. Doctor Role
*The clinical provider.*
*   **Access**: Clinical records, schedules, and medical actions. Restricted from financial editing.
*   **Flows**:
    *   **Schedule**: View their daily/weekly scheduled appointments.
    *   **Visits & EHR**: Conduct visits, record Chief Complaints, Diagnoses, Examination Notes, and Treatment Plans.
    *   **File Attachments**: Upload patient lab results, X-rays, or images to specific visit records.
    *   **Prescriptions**: Generate and print detailed medical prescriptions for patients.

### 4. Patient Role
*The end-user client.*
*   **Access**: Highly restricted. Can only view their own data and book their own appointments.
*   **Flows**:
    *   **Self-Scheduling**: Can browse available doctors and book appointments. 
    *   *Security Note*: When booking, the "Patient" selection field is strictly locked to their own profile, preventing them from booking on behalf of or viewing other patients.
    *   **History**: View their own upcoming appointments, past visit records, and active prescriptions.

---

## 📅 Development Timeline: What We Achieved

### Phase 1: Foundation & Scaffold
*   Initialized the Turborepo monorepo.
*   Created the OpenAPI standard (`openapi.yaml`) defining all primary endpoints.
*   Bootstrapped the frontend with Vite, Tailwind, Wouter, and basic layout components (Sidebar, Topbar).
*   Configured API client generation via `orval`.

### Phase 2: Backend Infrastructure & Core Entities
*   Built out the Drizzle PostgreSQL schemas (`users`, `patients`, `appointments`, `visits`, `invoices`, `prescriptions`).
*   Implemented the secure PASETO-based authentication backend (`/auth/login`, `/auth/register`).
*   Built CRUD route controllers for all entities, protected by Role-Based `authorize` middlewares.

### Phase 3: Frontend Views & Polish
*   Created fully functional React pages for Patients, Appointments, Visits, Invoices, and Prescriptions.
*   Designed a gorgeous, premium UI using modern CSS variables, glassmorphism, and responsive grid layouts.
*   Added Print functionality (`window.print()`) with dedicated `@media print` CSS for clean document generation (Invoices/Prescriptions).

### Phase 4: EHR, Analytics, & Security Enhancements
*   **EHR Attachments**: Implemented `multer` for `multipart/form-data` uploads, allowing Doctors to attach physical files/images directly to Visit records.
*   **Analytics**: Integrated `recharts` to build the interactive Reports Dashboard with Revenue and Appointment data visualizations.
*   **Hardening**: Secured the API with `express-rate-limit` to prevent abuse.
*   **Database Integrity**: Enforced strict relational foreign keys (`.references()`) across all Drizzle schemas to guarantee bulletproof database integrity.
*   **Patient Security**: Hardcoded frontend form logic to auto-bind and disable Patient IDs when regular users attempt to book an appointment.
