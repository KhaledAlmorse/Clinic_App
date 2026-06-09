import { useState } from "react";
import { Link } from "wouter";
import { useListAppointments, useUpdateAppointment, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, List, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfWeek, addWeeks } from "date-fns";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-600",
};

const STATUSES = ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"];

type ApptRow = { id: number; scheduledAt: string; patientName?: string | null; doctorName?: string | null; status: string; duration?: number };

function WeeklyCalendar({ appointments }: { appointments: ApptRow[] }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 12 }, (_, i) => i + 8);

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button onClick={() => setWeekOffset(w => w - 1)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium">{format(days[0], "MMM d")} – {format(days[6], "MMM d, yyyy")}</span>
        <button onClick={() => setWeekOffset(w => w + 1)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><ChevronRight size={16} /></button>
      </div>
      <div className="overflow-auto">
        <div className="grid" style={{ gridTemplateColumns: `4rem repeat(7, 1fr)`, minWidth: 600 }}>
          <div className="border-b border-r border-border" />
          {days.map(d => (
            <div key={d.toISOString()} className="border-b border-r border-border px-2 py-1.5 text-center">
              <p className="text-xs font-medium text-muted-foreground">{format(d, "EEE")}</p>
              <p className="text-sm font-bold text-foreground">{format(d, "d")}</p>
            </div>
          ))}
          {hours.map(h => (
            <>
              <div key={`h${h}`} className="border-b border-r border-border px-2 py-1 text-xs text-muted-foreground text-right">{h}:00</div>
              {days.map(d => {
                const dayAppts = appointments.filter(a => {
                  const at = new Date(a.scheduledAt);
                  return format(at, "yyyy-MM-dd") === format(d, "yyyy-MM-dd") && at.getHours() === h;
                });
                return (
                  <div key={d.toISOString()+h} className="border-b border-r border-border px-1 py-0.5 min-h-[48px]">
                    {dayAppts.map(a => (
                      <Link
                        key={a.id}
                        href={`/appointments/${a.id}`}
                        className={`block text-xs px-1.5 py-1 rounded mb-0.5 truncate ${STATUS_COLORS[a.status] ?? "bg-muted"}`}
                      >
                        {a.patientName ?? "Patient"}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const updateMutation = useUpdateAppointment();

  const params = { status: statusFilter || undefined, page, limit: 30 };
  const { data, isLoading } = useListAppointments(params, {
    query: { queryKey: getListAppointmentsQueryKey(params) }
  });

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: status as "scheduled" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show" } });
      queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const totalPages = data ? Math.ceil(data.total / 30) : 1;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("appointments")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{data?.total ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button onClick={() => setView("list")} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <List size={14} /> List
            </button>
            <button onClick={() => setView("calendar")} className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${view === "calendar" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <Calendar size={14} /> Calendar
            </button>
          </div>
          <Link
            href="/appointments/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus size={16} /> Book
          </Link>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setStatusFilter("")} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!statusFilter ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"}`}>
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {view === "calendar" && data ? (
        <WeeklyCalendar appointments={data.data} />
      ) : (
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
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Patient</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Doctor</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date & Time</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Duration</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map(appt => (
                    <tr key={appt.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{appt.patientName ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{appt.doctorName ?? "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{format(new Date(appt.scheduledAt), "MMM d, yyyy h:mm a")}</td>
                      <td className="px-4 py-3 capitalize text-muted-foreground">{appt.type?.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{appt.duration}m</td>
                      <td className="px-4 py-3">
                        <select
                          value={appt.status}
                          onChange={e => handleStatusChange(appt.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full font-medium border-0 cursor-pointer ${STATUS_COLORS[appt.status] ?? "bg-muted"}`}
                        >
                          {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/appointments/${appt.id}`} className="text-xs text-primary hover:underline">
                          View
                        </Link>
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
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40"><ChevronLeft size={15} /></button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-border hover:bg-muted disabled:opacity-40"><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
