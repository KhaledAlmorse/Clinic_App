import { useState } from "react";
import { Link } from "wouter";
import { useListPatients, useDeletePatient, getListPatientsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Trash2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/error";

export default function PatientsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useListPatients({ search: search || undefined, page, limit: 20 }, {
    query: { queryKey: getListPatientsQueryKey({ search, page, limit: 20 }) }
  });
  const deleteMutation = useDeletePatient();

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete patient ${name}?`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListPatientsQueryKey() });
      toast.success("Patient deleted");
    } catch (error) {
      showErrorToast(error, "Failed to delete patient");
    }
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("patients")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total ?? 0} total patients</p>
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={16} />
          {t("new")} Patient
        </Link>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={`${t("search")} patients...`}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="bg-card border border-card-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">{t("loading")}</div>
        ) : !data?.data.length ? (
          <div className="p-8 text-center text-muted-foreground">{t("noResults")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t("name")}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">{t("phone")}</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Gender</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Blood Type</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">DOB</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map(patient => (
                  <tr key={patient.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{patient.name}</p>
                        <p className="text-xs text-muted-foreground">{patient.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{patient.phone}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{patient.gender}</td>
                    <td className="px-4 py-3">
                      {patient.bloodType ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">{patient.bloodType}</span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{patient.dateOfBirth}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/patients/${patient.id}`}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => handleDelete(patient.id, patient.name)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
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
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 transition-colors"><ChevronLeft size={15} /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40 transition-colors"><ChevronRight size={15} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
