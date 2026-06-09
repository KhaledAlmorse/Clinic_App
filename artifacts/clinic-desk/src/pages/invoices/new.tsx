import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useCreateInvoice, useListPatients, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Item { description: string; quantity: number; unitPrice: number; total: number }
const emptyItem = (): Item => ({ description: "", quantity: 1, unitPrice: 0, total: 0 });

export default function NewInvoicePage({ patientId: prefill, visitId: visitPrefill }: { patientId?: string; visitId?: string }) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const createMutation = useCreateInvoice();
  const { data: patients } = useListPatients({ limit: 100 });

  const [patientId, setPatientId] = useState(prefill ?? "");
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Item[]>([emptyItem()]);

  const updateItem = (i: number, k: keyof Item, v: string | number) => {
    setItems(its => its.map((it, idx) => {
      if (idx !== i) return it;
      const updated = { ...it, [k]: v };
      updated.total = updated.quantity * updated.unitPrice;
      return updated;
    }));
  };

  const total = items.reduce((s, it) => s + it.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          patientId: parseInt(patientId),
          visitId: visitPrefill ? parseInt(visitPrefill) : undefined,
          items,
          issuedAt,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      toast.success("Invoice created");
      navigate("/invoices");
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/invoices" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18}/>
        </Link>
        <h1 className="text-2xl font-bold">New Invoice</h1>
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
              <label className={lbl}>Issue Date *</label>
              <input required type="date" value={issuedAt} onChange={e => setIssuedAt(e.target.value)} className={inp} />
            </div>
            <div>
              <label className={lbl}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inp} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Line Items</h2>
            <button type="button" onClick={() => setItems(its => [...its, emptyItem()])} className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium">
              <Plus size={13}/> Add Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5">
                  {i === 0 && <label className={lbl}>Description</label>}
                  <input required value={item.description} onChange={e => updateItem(i, "description", e.target.value)} className={inp} placeholder="Service description" />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className={lbl}>Qty</label>}
                  <input required type="number" min="1" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 1)} className={inp} />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className={lbl}>Unit Price</label>}
                  <input required type="number" step="0.01" min="0" value={item.unitPrice} onChange={e => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} className={inp} />
                </div>
                <div className="col-span-2">
                  {i === 0 && <label className={lbl}>Total</label>}
                  <div className={`${inp} bg-muted/50 font-medium text-foreground`}>${item.total.toFixed(2)}</div>
                </div>
                <div className="col-span-1 flex items-end pb-0.5">
                  {items.length > 1 && (
                    <button type="button" onClick={() => setItems(its => its.filter((_, idx) => idx !== i))} className="p-2 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 size={13}/></button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-right pt-2 border-t border-border">
            <span className="text-lg font-bold text-foreground">Total: ${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5">
          <label className={lbl}>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={inp} />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/invoices" className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted">Cancel</Link>
          <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60">
            {createMutation.isPending ? "Creating..." : "Create Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl = "block text-sm font-medium text-foreground mb-1.5";
const inp = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring";
