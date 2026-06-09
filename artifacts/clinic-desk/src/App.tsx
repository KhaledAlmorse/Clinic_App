import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import Layout from "@/components/Layout";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";

// Pages
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import MyRecordsPage from "@/pages/my-records";
import StaffPage from "@/pages/staff/index";
import ClinicSettingsPage from "@/pages/settings";
import ReportsPage from "@/pages/reports";
import PatientsPage from "@/pages/patients/index";
import NewPatientPage from "@/pages/patients/new";
import PatientDetailPage from "@/pages/patients/detail";
import EditPatientPage from "@/pages/patients/edit";
import AppointmentsPage from "@/pages/appointments/index";
import NewAppointmentPage from "@/pages/appointments/new";
import AppointmentDetailPage from "@/pages/appointments/detail";
import EditAppointmentPage from "@/pages/appointments/edit";
import VisitsPage from "@/pages/visits/index";
import NewVisitPage from "@/pages/visits/new";
import VisitDetailPage from "@/pages/visits/detail";
import PrescriptionsPage from "@/pages/prescriptions/index";
import NewPrescriptionPage from "@/pages/prescriptions/new";
import PrescriptionDetailPage from "@/pages/prescriptions/detail";
import InvoicesPage from "@/pages/invoices/index";
import NewInvoicePage from "@/pages/invoices/new";
import InvoiceDetailPage from "@/pages/invoices/detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <LoginPage />}
      </Route>
      <Route path="/register">
        {isAuthenticated ? <Redirect to="/dashboard" /> : <RegisterPage />}
      </Route>
      <Route path="/" component={LandingPage} />

      <Route path="/dashboard">
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      </Route>

      <Route path="/my-records">
        <ProtectedRoute><MyRecordsPage /></ProtectedRoute>
      </Route>

      <Route path="/staff">
        <ProtectedRoute><StaffPage /></ProtectedRoute>
      </Route>

      <Route path="/settings">
        <ProtectedRoute><ClinicSettingsPage /></ProtectedRoute>
      </Route>

      <Route path="/reports">
        <ProtectedRoute><ReportsPage /></ProtectedRoute>
      </Route>

      {/* Patients */}
      <Route path="/patients">
        <ProtectedRoute><PatientsPage /></ProtectedRoute>
      </Route>
      <Route path="/patients/new">
        <ProtectedRoute><NewPatientPage /></ProtectedRoute>
      </Route>
      <Route path="/patients/:id/edit">
        {(params) => (
          <ProtectedRoute><EditPatientPage id={parseInt(params.id)} /></ProtectedRoute>
        )}
      </Route>
      <Route path="/patients/:id">
        {(params) => (
          <ProtectedRoute><PatientDetailPage id={parseInt(params.id)} /></ProtectedRoute>
        )}
      </Route>

      {/* Appointments */}
      <Route path="/appointments">
        <ProtectedRoute><AppointmentsPage /></ProtectedRoute>
      </Route>
      <Route path="/appointments/new">
        {() => {
          const search = new URLSearchParams(window.location.search);
          return <ProtectedRoute><NewAppointmentPage patientId={search.get("patientId") ?? undefined} /></ProtectedRoute>;
        }}
      </Route>
      <Route path="/appointments/:id/edit">
        {(params) => (
          <ProtectedRoute><EditAppointmentPage id={parseInt(params.id)} /></ProtectedRoute>
        )}
      </Route>
      <Route path="/appointments/:id">
        {(params) => (
          <ProtectedRoute><AppointmentDetailPage id={parseInt(params.id)} /></ProtectedRoute>
        )}
      </Route>

      {/* Visits */}
      <Route path="/visits">
        <ProtectedRoute><VisitsPage /></ProtectedRoute>
      </Route>
      <Route path="/visits/new">
        {() => {
          const search = new URLSearchParams(window.location.search);
          return <ProtectedRoute><NewVisitPage patientId={search.get("patientId") ?? undefined} /></ProtectedRoute>;
        }}
      </Route>
      <Route path="/visits/:id">
        {(params) => (
          <ProtectedRoute><VisitDetailPage id={parseInt(params.id)} /></ProtectedRoute>
        )}
      </Route>

      {/* Prescriptions */}
      <Route path="/prescriptions">
        <ProtectedRoute><PrescriptionsPage /></ProtectedRoute>
      </Route>
      <Route path="/prescriptions/new">
        {() => {
          const search = new URLSearchParams(window.location.search);
          return <ProtectedRoute><NewPrescriptionPage patientId={search.get("patientId") ?? undefined} visitId={search.get("visitId") ?? undefined} /></ProtectedRoute>;
        }}
      </Route>
      <Route path="/prescriptions/:id">
        {(params) => (
          <ProtectedRoute><PrescriptionDetailPage id={parseInt(params.id)} /></ProtectedRoute>
        )}
      </Route>

      {/* Invoices */}
      <Route path="/invoices">
        <ProtectedRoute><InvoicesPage /></ProtectedRoute>
      </Route>
      <Route path="/invoices/new">
        {() => {
          const search = new URLSearchParams(window.location.search);
          return <ProtectedRoute><NewInvoicePage patientId={search.get("patientId") ?? undefined} visitId={search.get("visitId") ?? undefined} /></ProtectedRoute>;
        }}
      </Route>
      <Route path="/invoices/:id">
        {(params) => (
          <ProtectedRoute><InvoiceDetailPage id={parseInt(params.id)} /></ProtectedRoute>
        )}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AppRoutes />
          </WouterRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

export default App;
