import { useState } from "react";
import { Link } from "wouter";
import { useGetInvoice, useRecordPayment, getGetInvoiceQueryKey, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Printer, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/error";
import { downloadHtmlAsPdf } from "@/lib/pdf";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function InvoiceDetailPage({ id }: { id: number }) {
  const { data: invoice, isLoading } = useGetInvoice(id, {
    query: { queryKey: getGetInvoiceQueryKey(id) }
  });
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();
  const payMutation = useRecordPayment();
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [showPayForm, setShowPayForm] = useState(false);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payMutation.mutateAsync({ id, data: { amount: parseFloat(payAmount), paymentMethod: payMethod as "cash" | "card" | "insurance" | "bank_transfer" } });
      queryClient.invalidateQueries({ queryKey: getGetInvoiceQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListInvoicesQueryKey() });
      toast.success("Payment recorded");
      setShowPayForm(false);
      setPayAmount("");
    } catch (error) {
      showErrorToast(error, "Failed to record payment");
    }
  };

  const handlePrint = async () => {
    setIsExporting(true);
    try {
      await downloadHtmlAsPdf("invoice-document", `invoice-${invoice?.id}.pdf`);
    } catch (e) {
      toast.error("Failed to generate PDF");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!invoice) return <div className="p-8 text-center text-muted-foreground">Invoice not found</div>;

  const balance = Number(invoice.totalAmount) - Number(invoice.paidAmount);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 print:hidden">
        <Link href="/invoices" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18}/>
        </Link>
        <h1 className="text-2xl font-bold flex-1">Invoice #{invoice.id}</h1>
        {invoice.status !== "paid" && (
          <button onClick={() => setShowPayForm(v => !v)} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 flex items-center gap-2">
            <CreditCard size={15} /> Record Payment
          </button>
        )}
        <button onClick={handlePrint} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted disabled:opacity-50">
          <Printer size={15} /> {isExporting ? "Generating..." : "Download PDF"}
        </button>
      </div>

      {showPayForm && (
        <form onSubmit={handlePay} className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-4 print:hidden">
          <h3 className="font-semibold text-emerald-800">Record Payment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Amount *</label>
              <input required type="number" step="0.01" min="0.01" max={balance} value={payAmount} onChange={e => setPayAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder={`Max $${balance.toFixed(2)}`} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Payment Method</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="insurance">Insurance</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={payMutation.isPending} className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60">
              {payMutation.isPending ? "Processing..." : "Confirm Payment"}
            </button>
            <button type="button" onClick={() => setShowPayForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Cancel</button>
          </div>
        </form>
      )}

      <div id="invoice-document" className="bg-card border border-card-border rounded-xl p-6 print:border-2 print:p-8">
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold">INVOICE</h2>
            <p className="text-muted-foreground text-sm mt-0.5">#{invoice.id}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[invoice.status] ?? ""}`}>{invoice.status}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-muted-foreground">Patient</p>
            <p className="font-semibold">{invoice.patientName ?? `#${invoice.patientId}`}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Issue Date</p>
            <p className="font-medium">{invoice.issuedAt}</p>
          </div>
          {invoice.dueDate && (
            <div>
              <p className="text-muted-foreground">Due Date</p>
              <p className="font-medium">{invoice.dueDate}</p>
            </div>
          )}
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Qty</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Unit Price</th>
              <th className="text-right py-2 text-muted-foreground font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i} className="border-b border-border/50">
                <td className="py-2.5">{item.description}</td>
                <td className="py-2.5 text-right text-muted-foreground">{item.quantity}</td>
                <td className="py-2.5 text-right text-muted-foreground">${Number(item.unitPrice).toFixed(2)}</td>
                <td className="py-2.5 text-right font-medium">${Number(item.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${Number(invoice.totalAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Amount Paid</span>
            <span>- ${Number(invoice.paidAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
            <span>Balance Due</span>
            <span className={balance > 0 ? "text-red-600" : "text-green-600"}>${balance.toFixed(2)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg text-sm text-muted-foreground">
            <span className="font-medium">Notes: </span>{invoice.notes}
          </div>
        )}
      </div>
    </div>
  );
}
