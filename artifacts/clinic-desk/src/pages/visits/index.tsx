import { useState } from "react";
import { Link } from "wouter";
import { useListVisits, getListVisitsQueryKey } from "@workspace/api-client-react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export default function VisitsPage() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListVisits({ page, limit: 20 }, {
    query: { queryKey: getListVisitsQueryKey({ page, limit: 20 }) }
  });
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("visits")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total ?? 0} total records</p>
        </div>
        <Link href="/visits/new" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus size={16} /> New Record
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
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Diagnosis</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Chief Complaint</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(v => (
                  <tr key={v.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{v.patientName ?? `#${v.patientId}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.doctorName ?? `#${v.doctorId}`}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.visitDate}</td>
                    <td className="px-4 py-3">{v.diagnosis || <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{v.chiefComplaint || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/visits/${v.id}`} className="text-xs text-primary hover:underline">View</Link>
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
