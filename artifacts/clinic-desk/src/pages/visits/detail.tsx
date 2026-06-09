import { Link } from "wouter";
import { useGetVisit, getGetVisitQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, FileText, Calendar, Upload, Download } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function VisitDetailPage({ id }: { id: number }) {
  const { user } = useAuth();
  const { data: visit, isLoading } = useGetVisit(id, {
    query: { queryKey: getGetVisitQueryKey(id) }
  });
  
  const { data: attachments, refetch: refetchAttachments } = useQuery({
    queryKey: ["visit_attachments", id],
    queryFn: () => api.get(`/visits/${id}/attachments`).then(res => res.data),
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const canManagePrescriptions = user?.role === "admin" || user?.role === "doctor";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.postForm(`/visits/${id}/attachments`, formData);
      toast.success("File uploaded successfully");
      refetchAttachments();
    } catch {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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
          {canManagePrescriptions && (
            <Link
              href={`/prescriptions/new?patientId=${visit.patientId}&visitId=${visit.id}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted"
            >
              <FileText size={14}/>Prescribe
            </Link>
          )}
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
        <Section title="Attachments">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                <Upload size={14} /> {uploading ? "Uploading..." : "Upload File"}
              </button>
            </div>
            
            {!attachments?.length ? (
              <p className="text-sm text-muted-foreground">No files attached to this visit.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((file: any) => (
                  <li key={file.id} className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted/20">
                    <div className="truncate pr-4">
                      <p className="text-sm font-medium truncate" title={file.fileName}>{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(file.uploadedAt).toLocaleString()}</p>
                    </div>
                    <a href={file.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-md hover:bg-muted text-primary" title="Download">
                      <Download size={16} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>
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
