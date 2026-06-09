import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateVisit, useListPatients, getListVisitsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function NewVisitPage({ patientId: prefill }: { patientId?: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createMutation = useCreateVisit();
  const { user } = useAuth();
  const { data: patients } = useListPatients({ limit: 100 });

  const [form, setForm] = useState({
    patientId: prefill ?? "",
    doctorId: user?.role === "doctor" ? String(user.id) : "",
    visitDate: new Date().toISOString().split("T")[0],
    chiefComplaint: "", diagnosis: "", examinationNotes: "",
    labResults: "", treatmentPlan: "", followUpDate: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const visit = await createMutation.mutateAsync({
        data: {
          patientId: parseInt(form.patientId),
          doctorId: parseInt(form.doctorId),
          visitDate: form.visitDate,
          chiefComplaint: form.chiefComplaint || undefined,
          diagnosis: form.diagnosis || undefined,
          examinationNotes: form.examinationNotes || undefined,
          labResults: form.labResults || undefined,
          treatmentPlan: form.treatmentPlan || undefined,
          followUpDate: form.followUpDate || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListVisitsQueryKey() });
      toast.success("Visit recorded");
      navigate(`/visits/${visit.id}`);
    } catch {
      toast.error("Failed to record visit");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/visits" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18}/>
        </Link>
        <h1 className="text-2xl font-bold">New Visit Record</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={lbl}>Patient *</label>
            <select required value={form.patientId} onChange={set("patientId")} className={inp}>
              <option value="">Select patient</option>
              {patients?.data.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Doctor ID *</label>
            <input required type="number" value={form.doctorId} onChange={set("doctorId")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Visit Date *</label>
            <input required type="date" value={form.visitDate} onChange={set("visitDate")} className={inp} />
          </div>
        </div>
        <F label="Chief Complaint"><textarea value={form.chiefComplaint} onChange={set("chiefComplaint")} rows={2} className={inp} /></F>
        <F label="Examination Notes"><textarea value={form.examinationNotes} onChange={set("examinationNotes")} rows={3} className={inp} /></F>
        <F label="Diagnosis"><textarea value={form.diagnosis} onChange={set("diagnosis")} rows={2} className={inp} /></F>
        <F label="Lab Results"><textarea value={form.labResults} onChange={set("labResults")} rows={2} className={inp} /></F>
        <F label="Treatment Plan"><textarea value={form.treatmentPlan} onChange={set("treatmentPlan")} rows={3} className={inp} /></F>
        <div>
          <label className={lbl}>Follow-up Date</label>
          <input type="date" value={form.followUpDate} onChange={set("followUpDate")} className={inp} style={{ maxWidth: 200 }} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/visits" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {createMutation.isPending ? "Saving..." : "Save Record"}
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl = "block text-sm font-medium text-foreground mb-1.5";
const inp = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className={lbl}>{label}</label>{children}</div>;
}
