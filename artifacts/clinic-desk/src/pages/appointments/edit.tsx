import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useGetAppointment, useUpdateAppointment, useListPatients, getGetAppointmentQueryKey, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/error";

const APPT_TYPES = ["consultation", "follow_up", "emergency", "checkup", "procedure"] as const;

export default function EditAppointmentPage({ id }: { id: number }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: appt } = useGetAppointment(id, {
    query: { queryKey: getGetAppointmentQueryKey(id) }
  });
  const { data: patients } = useListPatients({ limit: 100 });
  const updateMutation = useUpdateAppointment();

  const [form, setForm] = useState({
    patientId: "", doctorId: "2", scheduledAt: "", type: "consultation" as string, notes: ""
  });

  useEffect(() => {
    if (appt) {
      const dt = new Date(appt.scheduledAt);
      const localISO = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setForm({
        patientId: String(appt.patientId),
        doctorId: String(appt.doctorId ?? 2),
        scheduledAt: localISO,
        type: appt.type ?? "consultation",
        notes: appt.notes ?? "",
      });
    }
  }, [appt]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          patientId: parseInt(form.patientId),
          doctorId: parseInt(form.doctorId),
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          type: form.type as any,
          notes: form.notes || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetAppointmentQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      toast.success("Appointment updated");
      navigate(`/appointments/${id}`);
    } catch (error) {
      showErrorToast(error, "Failed to update appointment");
    }
  };

  if (!appt) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/appointments/${id}`} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold">Edit Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Patient *">
            <select required value={form.patientId} onChange={set("patientId")} className={inp}>
              <option value="">Select patient</option>
              {patients?.data.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Doctor ID *">
            <select required value={form.doctorId} onChange={set("doctorId")} className={inp}>
              <option value="2">Dr. Smith (ID: 2)</option>
              <option value="3">Dr. Sara Ali (ID: 3)</option>
            </select>
          </Field>
          <Field label="Date & Time *">
            <input required type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} className={inp} />
          </Field>
          <Field label="Type">
            <select value={form.type} onChange={set("type")} className={inp}>
              {APPT_TYPES.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes"><textarea value={form.notes} onChange={set("notes")} rows={3} className={inp} /></Field>

        <div className="flex justify-end gap-3 pt-2">
          <Link href={`/appointments/${id}`} className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inp = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>{children}</div>;
}
