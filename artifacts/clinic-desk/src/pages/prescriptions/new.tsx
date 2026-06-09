import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreatePrescription, useListPatients, getListPrescriptionsQueryKey, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Med { name: string; dosage: string; frequency: string; duration: string; instructions: string }
const emptyMed = (): Med => ({ name: "", dosage: "", frequency: "", duration: "", instructions: "" });

export default function NewPrescriptionPage({ patientId: prefill, visitId: visitPrefill }: { patientId?: string; visitId?: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createMutation = useCreatePrescription();
  const { user } = useAuth();
  const canManagePrescriptions = user?.role === "admin" || user?.role === "doctor";
  const { data: patients } = useListPatients(
    { limit: 100 },
    { query: { enabled: canManagePrescriptions, queryKey: getListPatientsQueryKey({ limit: 100 }) } }
  );

  const [patientId, setPatientId] = useState(prefill ?? "");
  const [doctorId, setDoctorId] = useState(user?.role === "doctor" ? String(user.id) : "");
  const [visitId] = useState(visitPrefill ?? "");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [meds, setMeds] = useState<Med[]>([emptyMed()]);

  const updateMed = (i: number, k: keyof Med, v: string) =>
    setMeds(ms => ms.map((m, idx) => idx === i ? { ...m, [k]: v } : m));
  const addMed = () => setMeds(ms => [...ms, emptyMed()]);
  const removeMed = (i: number) => setMeds(ms => ms.filter((_, idx) => idx !== i));

  if (!canManagePrescriptions) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prescription Creation Restricted</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Patients can view their prescriptions, but only doctors and admins can create new ones.
            </p>
          </div>
          <Link href="/prescriptions" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
            <ArrowLeft size={16} />
            Back to Prescriptions
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          patientId: parseInt(patientId),
          doctorId: parseInt(doctorId),
          visitId: visitId ? parseInt(visitId) : undefined,
          medications: meds.map(m => ({ ...m, instructions: m.instructions || undefined })),
          notes: notes || undefined,
          issuedAt,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListPrescriptionsQueryKey() });
      toast.success("Prescription created");
      navigate("/prescriptions");
    } catch {
      toast.error("Failed to create prescription");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/prescriptions" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18}/>
        </Link>
        <h1 className="text-2xl font-bold">New Prescription</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={lbl}>Patient *</label>
              <select required value={patientId} onChange={e => setPatientId(e.target.value)} className={inp}>
                <option value="">Select patient</option>
                {patients?.data.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Doctor ID *</label>
              <input required type="number" value={doctorId} onChange={e => setDoctorId(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Issue Date *</label>
              <input required type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} className={inp} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Medications</h2>
            <button type="button" onClick={addMed} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
              <Plus size={13}/> Add Medication
            </button>
          </div>
          {meds.map((med, i) => (
            <div key={i} className="p-4 border border-border rounded-xl space-y-3 relative">
              {meds.length > 1 && (
                <button type="button" onClick={() => removeMed(i)} className="absolute top-3 right-3 p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600">
                  <Trash2 size={13}/>
                </button>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className={lbl}>Medicine Name *</label>
                  <input required value={med.name} onChange={e => updateMed(i, "name", e.target.value)} className={inp} placeholder="e.g. Amoxicillin" />
                </div>
                <div>
                  <label className={lbl}>Dosage *</label>
                  <input required value={med.dosage} onChange={e => updateMed(i, "dosage", e.target.value)} className={inp} placeholder="500mg" />
                </div>
                <div>
                  <label className={lbl}>Frequency *</label>
                  <input required value={med.frequency} onChange={e => updateMed(i, "frequency", e.target.value)} className={inp} placeholder="3x daily" />
                </div>
                <div>
                  <label className={lbl}>Duration *</label>
                  <input required value={med.duration} onChange={e => updateMed(i, "duration", e.target.value)} className={inp} placeholder="7 days" />
                </div>
                <div className="sm:col-span-3">
                  <label className={lbl}>Instructions</label>
                  <input value={med.instructions} onChange={e => updateMed(i, "instructions", e.target.value)} className={inp} placeholder="Take after meals" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <label className={lbl}>Additional Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inp} />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/prescriptions" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {createMutation.isPending ? "Creating..." : "Create Prescription"}
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl = "block text-sm font-medium text-foreground mb-1.5";
const inp = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
