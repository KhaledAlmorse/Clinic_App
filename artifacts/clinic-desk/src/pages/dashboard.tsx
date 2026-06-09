import { useGetDashboardStats, useGetRevenueReport, useGetTodayAppointments, useGetRecentActivity } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Calendar, Receipt, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex gap-4 items-start">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  no_show: "bg-gray-100 text-gray-600",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: stats } = useGetDashboardStats();
  const { data: revenue } = useGetRevenueReport();
  const { data: todayAppts } = useGetTodayAppointments();
  const { data: activity } = useGetRecentActivity();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting()}, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={18} className="text-primary-foreground" />}
          color="bg-primary"
          label="Total Patients"
          value={stats?.totalPatients ?? 0}
          sub={`+${stats?.newPatientsThisMonth ?? 0} this month`}
        />
        <StatCard
          icon={<Calendar size={18} className="text-white" />}
          color="bg-blue-500"
          label="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          sub={`${stats?.completedAppointments ?? 0} completed`}
        />
        <StatCard
          icon={<Receipt size={18} className="text-white" />}
          color="bg-amber-500"
          label="Pending Invoices"
          value={stats?.pendingInvoices ?? 0}
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-white" />}
          color="bg-emerald-500"
          label="Total Revenue"
          value={`$${(stats?.totalRevenue ?? 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Revenue Overview</h2>
          {revenue && revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenue} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activity && activity.length > 0 ? activity.slice(0, 8).map(item => (
              <div key={item.id} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-foreground leading-snug">{item.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(item.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Today's Appointments</h2>
          <span className="text-xs text-muted-foreground">{todayAppts?.length ?? 0} appointments</span>
        </div>
        {todayAppts && todayAppts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Time</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Patient</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Doctor</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Type</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAppts.map(appt => (
                  <tr key={appt.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">{format(new Date(appt.scheduledAt), "h:mm a")}</td>
                    <td className="py-2.5 pr-4">{appt.patientName}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{appt.doctorName}</td>
                    <td className="py-2.5 pr-4 capitalize text-muted-foreground">{appt.type}</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {appt.status.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <Clock size={32} className="mx-auto mb-2 opacity-30" />
            No appointments scheduled for today
          </div>
        )}
      </div>
    </div>
  );
}
