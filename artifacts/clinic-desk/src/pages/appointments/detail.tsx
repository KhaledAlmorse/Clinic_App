import { Link } from "wouter";
import { useGetAppointment, useUpdateAppointment, getGetAppointmentQueryKey, getListAppointmentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Calendar, User, Clock, FileText, Activity } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/error";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-600",
};

const STATUSES = ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"];

export default function AppointmentDetailPage({ id }: { id: number }) {
  const { data: appt, isLoading } = useGetAppointment(id, {
    query: { queryKey: getGetAppointmentQueryKey(id) }
  });
  const queryClient = useQueryClient();
  const updateMutation = useUpdateAppointment();

  const handleStatusChange = async (status: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status: status as any } });
      queryClient.invalidateQueries({ queryKey: getGetAppointmentQueryKey(id) });
      queryClient.invalidateQueries({ queryKey: getListAppointmentsQueryKey() });
      toast.success("Status updated");
    } catch (error) {
      showErrorToast(error, "Failed to update status");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  if (!appt) return <div className="p-8 text-center text-muted-foreground">Appointment not found</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/appointments" className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Appointment #{appt.id}</h1>
          <p className="text-muted-foreground text-sm">{format(new Date(appt.scheduledAt), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Link
          href={`/visits/new?patientId=${appt.patientId}`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
        >
          <Activity size={14} /> Start Visit
        </Link>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoCard icon={<User size={18} />} label="Patient" value={appt.patientName ?? `#${appt.patientId}`} />
          <InfoCard icon={<User size={18} />} label="Doctor" value={appt.doctorName ?? `#${appt.doctorId}`} />
          <InfoCard icon={<Calendar size={18} />} label="Date & Time" value={format(new Date(appt.scheduledAt), "MMM d, yyyy h:mm a")} />
          <InfoCard icon={<Clock size={18} />} label="Duration" value={`${appt.duration ?? 30} minutes`} />
          <InfoCard icon={<FileText size={18} />} label="Type" value={appt.type?.replace("_", " ") ?? "Consultation"} />
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  appt.status === s
                    ? `${STATUS_COLORS[s] ?? "bg-muted"} border-transparent`
                    : "border-border hover:bg-muted text-muted-foreground"
                }`}
              >
                {s.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {appt.notes && (
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Notes</p>
            <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3">{appt.notes}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/appointments/new?patientId=${appt.patientId}`}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Calendar size={14} /> Book Another
        </Link>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20">
      <span className="text-muted-foreground">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground capitalize">{value}</p>
      </div>
    </div>
  );
}
