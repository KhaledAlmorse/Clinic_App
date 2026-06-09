import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateAppointment, useListPatients, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function NewAppointmentPage({ patientId: prefill }: { patientId?: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createMutation = useCreateAppointment();
  const { user } = useAuth();
  const { data: patients } = useListPatients({ limit: 100 });

  const [form, setForm] = useState({
    patientId: prefill ?? "",
    doctorId: user?.role === "doctor" ? String(user.id) : "",
    scheduledAt: "",
    duration: "30",
    type: "consultation" as const,
    notes: "",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          patientId: parseInt(form.patientId),
          doctorId: parseInt(form.doctorId),
          scheduledAt: new Date(form.scheduledAt).toISOString(),
          duration: parseInt(form.duration),
          type: form.type,
          notes: form.notes || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      toast.success("Appointment booked");
      navigate("/appointments");
    } catch {
      toast.error("Failed to book appointment");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/appointments" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold">Book Appointment</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Patient *</label>
            <select required value={form.patientId} onChange={set("patientId")} className={inp}>
              <option value="">Select patient</option>
              {patients?.data.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Doctor ID *</label>
            <input required type="number" value={form.doctorId} onChange={set("doctorId")} className={inp} placeholder="Doctor user ID" />
          </div>
          <div>
            <label className={lbl}>Date & Time *</label>
            <input required type="datetime-local" value={form.scheduledAt} onChange={set("scheduledAt")} className={inp} />
          </div>
          <div>
            <label className={lbl}>Duration (minutes)</label>
            <select value={form.duration} onChange={set("duration")} className={inp}>
              {[15, 20, 30, 45, 60, 90].map(d => <option key={d} value={d}>{d} min</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={lbl}>Type *</label>
            <select required value={form.type} onChange={set("type")} className={inp}>
              <option value="consultation">Consultation</option>
              <option value="follow_up">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="checkup">Checkup</option>
              <option value="procedure">Procedure</option>
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Notes</label>
          <textarea value={form.notes} onChange={set("notes")} rows={3} className={inp} />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Link href="/appointments" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {createMutation.isPending ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl = "block text-sm font-medium text-foreground mb-1.5";
const inp = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
