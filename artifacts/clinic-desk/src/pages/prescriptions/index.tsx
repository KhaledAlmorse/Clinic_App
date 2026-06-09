import { useState } from "react";
import { Link } from "wouter";
import { useListPrescriptions, getListPrescriptionsQueryKey } from "@workspace/api-client-react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function PrescriptionsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListPrescriptions({ page, limit: 20 }, {
    query: { queryKey: getListPrescriptionsQueryKey({ page, limit: 20 }) }
  });
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("prescriptions")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <Link href="/prescriptions/new" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus size={16} /> New Prescription
        </Link>
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {isLoading ? <div className="p-8 text-center text-muted-foreground">{t("loading")}</div> :
        !data?.data.length ? <div className="p-8 text-center text-muted-foreground">{t("noResults")}</div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Patient</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Doctor</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Medications</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Issued</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(p => (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.patientName ?? `#${p.patientId}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.doctorName ?? `#${p.doctorId}`}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.medications.slice(0, 3).map((m, i) => (
                          <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">{m.name}</span>
                        ))}
                        {p.medications.length > 3 && <span className="text-xs text-muted-foreground">+{p.medications.length-3} more</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.issuedAt}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/prescriptions/${p.id}`} className="text-xs text-primary hover:underline">View</Link>
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
