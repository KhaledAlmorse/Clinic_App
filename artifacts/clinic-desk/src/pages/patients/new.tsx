import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreatePatient, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/error";

export default function NewPatientPage() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createMutation = useCreatePatient();

  const [form, setForm] = useState({
    name: "", email: "", phone: "", dateOfBirth: "", gender: "male" as const,
    bloodType: "", address: "", allergies: "", emergencyContact: "", notes: ""
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const patient = await createMutation.mutateAsync({
        data: {
          ...form,
          bloodType: form.bloodType || undefined,
          address: form.address || undefined,
          allergies: form.allergies || undefined,
          emergencyContact: form.emergencyContact || undefined,
          notes: form.notes || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
      toast.success("Patient created successfully");
      navigate(`/patients/${patient.id}`);
    } catch (error) {
      showErrorToast(error, "Failed to create patient");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/patients" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Patient</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name *"><input required value={form.name} onChange={set("name")} className={inputCls} /></Field>
          <Field label="Email *"><input required type="email" value={form.email} onChange={set("email")} className={inputCls} /></Field>
          <Field label="Phone *"><input required value={form.phone} onChange={set("phone")} className={inputCls} /></Field>
          <Field label="Date of Birth *"><input required type="date" value={form.dateOfBirth} onChange={set("dateOfBirth")} className={inputCls} /></Field>
          <Field label="Gender *">
            <select required value={form.gender} onChange={set("gender")} className={inputCls}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Blood Type">
            <select value={form.bloodType} onChange={set("bloodType")} className={inputCls}>
              <option value="">Unknown</option>
              {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Address"><input value={form.address} onChange={set("address")} className={inputCls} /></Field>
        <Field label="Allergies"><textarea value={form.allergies} onChange={set("allergies")} rows={2} className={inputCls} /></Field>
        <Field label="Emergency Contact"><input value={form.emergencyContact} onChange={set("emergencyContact")} className={inputCls} placeholder="Name — Phone" /></Field>
        <Field label="Notes"><textarea value={form.notes} onChange={set("notes")} rows={3} className={inputCls} /></Field>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/patients" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
            {createMutation.isPending ? "Saving..." : "Create Patient"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
