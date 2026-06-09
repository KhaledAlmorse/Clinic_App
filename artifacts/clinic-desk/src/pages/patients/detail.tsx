import { Link } from "wouter";
import { useGetPatient, useListVisits, useListPrescriptions, useListInvoices, getGetPatientQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, Calendar, FileText, Receipt, Heart, Phone, Mail, MapPin, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function PatientDetailPage({ id }: { id: number }) {
  const { user } = useAuth();
  const { data: patient, isLoading } = useGetPatient(id, {
    query: { queryKey: getGetPatientQueryKey(id) }
  });
  const { data: visits } = useListVisits({ patientId: id });
  const { data: prescriptions } = useListPrescriptions({ patientId: id });
  const { data: invoices } = useListInvoices({ patientId: id });
  const canManagePrescriptions = user?.role === "admin" || user?.role === "doctor";

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!patient) return <div className="p-8 text-center text-muted-foreground">Patient not found</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/patients" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
          <p className="text-muted-foreground text-sm">Patient ID #{patient.id}</p>
        </div>
        <Link
          href={`/appointments/new?patientId=${patient.id}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Calendar size={15} /> Book Appointment
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide text-muted-foreground">Demographics</h2>
            <InfoRow icon={<Mail size={14}/>} label="Email" value={patient.email} />
            <InfoRow icon={<Phone size={14}/>} label="Phone" value={patient.phone} />
            <InfoRow icon={<Calendar size={14}/>} label="Date of Birth" value={patient.dateOfBirth} />
            <InfoRow icon={<Heart size={14}/>} label="Blood Type" value={patient.bloodType ?? "Unknown"} />
            <InfoRow icon={<MapPin size={14}/>} label="Gender" value={patient.gender} />
            {patient.address && <InfoRow icon={<MapPin size={14}/>} label="Address" value={patient.address} />}
          </div>

          {patient.allergies && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={15} className="text-red-600" />
                <span className="text-sm font-semibold text-red-700">Allergies</span>
              </div>
              <p className="text-sm text-red-700">{patient.allergies}</p>
            </div>
          )}

          {patient.emergencyContact && (
            <div className="bg-card border border-card-border rounded-xl p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">Emergency Contact</p>
              <p className="text-sm text-foreground">{patient.emergencyContact}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-5">
          <Section title="Medical Visits" count={visits?.total} newHref={`/visits/new?patientId=${id}`}>
            {visits?.data.slice(0, 3).map(v => (
              <Link key={v.id} href={`/visits/${v.id}`} className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-sm text-foreground">{v.diagnosis || "No diagnosis recorded"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{v.visitDate} · Dr. {v.doctorName}</p>
                  </div>
                  {v.chiefComplaint && <p className="text-xs text-muted-foreground max-w-[140px] text-right">{v.chiefComplaint}</p>}
                </div>
              </Link>
            ))}
            {!visits?.data.length && <p className="text-sm text-muted-foreground py-3 text-center">No visits recorded</p>}
          </Section>

          <Section title="Prescriptions" count={prescriptions?.total} newHref={canManagePrescriptions ? `/prescriptions/new?patientId=${id}` : undefined}>
            {prescriptions?.data.slice(0, 3).map(p => (
              <Link key={p.id} href={`/prescriptions/${p.id}`} className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                <div className="flex justify-between">
                  <p className="font-medium text-sm">{p.medications.length} medication{p.medications.length !== 1 ? "s" : ""}</p>
                  <p className="text-xs text-muted-foreground">{p.issuedAt}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{p.medications.map(m => m.name).join(", ")}</p>
              </Link>
            ))}
            {!prescriptions?.data.length && <p className="text-sm text-muted-foreground py-3 text-center">No prescriptions</p>}
          </Section>

          <Section title="Invoices" count={invoices?.total} newHref={`/invoices/new?patientId=${id}`}>
            {invoices?.data.slice(0, 3).map(inv => (
              <Link key={inv.id} href={`/invoices/${inv.id}`} className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">${Number(inv.totalAmount).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{inv.issuedAt}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] ?? ""}`}>{inv.status}</span>
                </div>
              </Link>
            ))}
            {!invoices?.data.length && <p className="text-sm text-muted-foreground py-3 text-center">No invoices</p>}
          </Section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, count, newHref, children }: {
  title: string; count?: number; newHref?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {count !== undefined && <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">{count}</span>}
        </div>
        {newHref && (
          <Link href={newHref} className="text-xs text-primary hover:underline font-medium">
            + New
          </Link>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
