import { useState } from "react";
import { Link } from "wouter";
import { useListInvoices, getListInvoicesQueryKey } from "@workspace/api-client-react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const params = { page, limit: 20, status: statusFilter || undefined };
  const { data, isLoading } = useListInvoices(params, {
    query: { queryKey: getListInvoicesQueryKey(params) }
  });
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("invoices")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Link href="/invoices/new" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus size={16} /> New Invoice
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["", "pending", "partial", "paid", "cancelled"].map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-muted-foreground">{t("loading")}</div> :
        !data?.data.length ? <div className="p-8 text-center text-muted-foreground">{t("noResults")}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">#</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Patient</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Total</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Paid</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Balance</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Issued</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(inv => (
                  <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">#{inv.id}</td>
                    <td className="px-4 py-3 font-medium">{inv.patientName ?? `#${inv.patientId}`}</td>
                    <td className="px-4 py-3 font-medium">${Number(inv.totalAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 text-muted-foreground">${Number(inv.paidAmount).toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium">${(Number(inv.totalAmount) - Number(inv.paidAmount)).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"}`}>{inv.status}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.issuedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/invoices/${inv.id}`} className="text-xs text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-border flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} of {totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft size={15}/></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40"><ChevronRight size={15}/></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
