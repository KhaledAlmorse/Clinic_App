import { Link } from "wouter";
import { useGetVisit, getGetVisitQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, FileText, Calendar } from "lucide-react";

export default function VisitDetailPage({ id }: { id: number }) {
  const { data: visit, isLoading } = useGetVisit(id, {
    query: { queryKey: getGetVisitQueryKey(id) }
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!visit) return <div className="p-8 text-center text-muted-foreground">Visit not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/visits" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18}/>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Visit Record #{visit.id}</h1>
          <p className="text-muted-foreground text-sm">{visit.patientName} · {visit.visitDate}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link
            href={`/prescriptions/new?patientId=${visit.patientId}&visitId=${visit.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted"
          >
            <FileText size={14}/>Prescribe
          </Link>
          <Link
            href={`/invoices/new?patientId=${visit.patientId}&visitId=${visit.id}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted"
          >
            <Calendar size={14}/>Invoice
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Patient Info">
          <Row label="Patient" value={visit.patientName ?? `#${visit.patientId}`} />
          <Row label="Doctor" value={visit.doctorName ?? `#${visit.doctorId}`} />
          <Row label="Visit Date" value={visit.visitDate} />
          {visit.followUpDate && <Row label="Follow-up" value={visit.followUpDate} />}
        </Section>
        <Section title="Chief Complaint">
          <p className="text-sm text-foreground whitespace-pre-wrap">{visit.chiefComplaint || <span className="text-muted-foreground">Not recorded</span>}</p>
        </Section>
        <Section title="Diagnosis">
          <p className="text-sm text-foreground whitespace-pre-wrap">{visit.diagnosis || <span className="text-muted-foreground">Not recorded</span>}</p>
        </Section>
        <Section title="Examination Notes">
          <p className="text-sm text-foreground whitespace-pre-wrap">{visit.examinationNotes || <span className="text-muted-foreground">Not recorded</span>}</p>
        </Section>
        {visit.labResults && (
          <Section title="Lab Results">
            <p className="text-sm text-foreground whitespace-pre-wrap">{visit.labResults}</p>
          </Section>
        )}
        {visit.treatmentPlan && (
          <Section title="Treatment Plan">
            <p className="text-sm text-foreground whitespace-pre-wrap">{visit.treatmentPlan}</p>
          </Section>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3 tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
