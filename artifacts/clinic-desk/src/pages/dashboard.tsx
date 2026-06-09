import {
  useGetDashboardStats,
  useGetRevenueReport,
  useGetTodayAppointments,
  useGetRecentActivity,
} from "@workspace/api-client-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import {
  Users,
  Calendar,
  Receipt,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Banknote,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex gap-4 items-start">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
        {sub && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{sub}</p>
        )}
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

const revenueChartConfig = {
  revenue: {
    label: "Collected revenue",
    color: "hsl(var(--primary))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;

export default function DashboardPage() {
  const { user } = useAuth();
  if (user?.role === "patient") {
    return <PatientDashboard />;
  }
  return <StaffDashboard />;
}

function PatientDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto mt-8">
      <div className="bg-card border border-card-border rounded-xl p-8 text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Welcome to ClinicDesk, {user?.name?.split(" ")[0]}!</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          From your dashboard, you can securely book new appointments, manage your existing schedule, access your medical prescriptions, and view your invoices.
        </p>
        <div className="pt-6 flex justify-center gap-4 flex-wrap">
          <Link href="/appointments" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
            My Appointments
          </Link>
          <Link href="/appointments/new" className="px-5 py-2.5 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors">
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}

function StaffDashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { data: stats } = useGetDashboardStats();
  const { data: revenue } = useGetRevenueReport();
  const { data: todayAppts } = useGetTodayAppointments();
  const { data: activity } = useGetRecentActivity();
  const revenueData = revenue ?? [];
  const revenueTotal = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const revenueAverage = revenueData.length
    ? revenueTotal / revenueData.length
    : 0;
  const revenueInvoices = revenueData.reduce(
    (sum, item) => sum + (item.invoiceCount ?? 0),
    0,
  );
  const latestPoint = revenueData[revenueData.length - 1];
  const previousPoint = revenueData[revenueData.length - 2];
  const monthlyGrowth =
    latestPoint && previousPoint && previousPoint.revenue > 0
      ? ((latestPoint.revenue - previousPoint.revenue) /
        previousPoint.revenue) *
      100
      : null;
  const peakPoint = revenueData.reduce(
    (best, current) =>
      current.revenue > (best?.revenue ?? 0) ? current : best,
    revenueData[0],
  );

  const currency = (value: number) =>
    value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

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
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.name?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
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
        <Card className="lg:col-span-2 overflow-hidden border-border/70 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Revenue Overview</CardTitle>
                <CardDescription className="mt-1 max-w-2xl">
                  Paid invoice revenue over the last 6 months. This view shows
                  collected cash, not the value of unpaid invoices.
                </CardDescription>
              </div>
              <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <ArrowUpRight size={14} />
                {monthlyGrowth === null
                  ? ""
                  : `${monthlyGrowth >= 0 ? "+" : ""}${monthlyGrowth.toFixed(1)}% vs previous month`}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {revenue && revenue.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <MetricPill
                    icon={<Banknote size={16} />}
                    label="6 month total"
                    value={currency(revenueTotal)}
                  />
                  <MetricPill
                    icon={<TrendingUp size={16} />}
                    label="Monthly average"
                    value={currency(revenueAverage)}
                  />
                  <MetricPill
                    icon={<FileText size={16} />}
                    label="Invoices counted"
                    value={String(revenueInvoices)}
                  />
                </div>

                <div className="rounded-2xl border border-border/60 bg-gradient-to-b from-muted/20 to-background p-3">
                  <ChartContainer
                    config={revenueChartConfig}
                    className="h-[320px] w-full"
                  >
                    <AreaChart
                      data={revenueData}
                      margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="revenueFill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.35}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.03}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tickMargin={12}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          `$${Number(value).toLocaleString()}`
                        }
                      />
                      <ReferenceLine
                        y={revenueAverage}
                        stroke="hsl(var(--muted-foreground))"
                        strokeDasharray="5 5"
                      />
                      <ChartTooltip
                        cursor={{
                          stroke: "hsl(var(--border))",
                          strokeWidth: 1,
                        }}
                        content={
                          <ChartTooltipContent
                            formatter={(value, name, item) => {
                              const point = item.payload as {
                                invoiceCount?: number;
                              };
                              return (
                                <div className="flex w-full items-center justify-between gap-8">
                                  <span className="text-muted-foreground">
                                    {name}
                                  </span>
                                  <span className="font-semibold text-foreground">
                                    {currency(Number(value))}
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                      {point.invoiceCount ?? 0} invoices
                                    </span>
                                  </span>
                                </div>
                              );
                            }}
                          />
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2.5}
                        fill="url(#revenueFill)"
                        dot={{
                          r: 3,
                          strokeWidth: 2,
                          fill: "hsl(var(--background))",
                        }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Best month
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {peakPoint ? peakPoint.month : "No data"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {peakPoint
                        ? currency(peakPoint.revenue)
                        : "Revenue data will appear here once invoices are paid."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      What this shows
                    </p>
                    <p className="mt-1 text-sm text-foreground leading-relaxed">
                      The chart tracks paid invoice revenue only, so it helps
                      you read collected income, spot momentum, and compare
                      months at a glance.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 py-10 text-center">
                <p className="text-base font-medium text-foreground">
                  No revenue data yet
                </p>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Once invoices are paid, this section will show a
                  month-by-month revenue trend, your average collected income,
                  and the strongest performing month.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <div className="bg-card border border-card-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {activity && activity.length > 0 ? (
              activity.slice(0, 8).map((item) => (
                <div key={item.id} className="flex gap-3 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm text-foreground leading-snug">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(item.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Today's appointments */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">
            Today's Appointments
          </h2>
          <span className="text-xs text-muted-foreground">
            {todayAppts?.length ?? 0} appointments
          </span>
        </div>
        {todayAppts && todayAppts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Time
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Patient
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Doctor
                  </th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                    Type
                  </th>
                  <th className="text-left py-2 text-muted-foreground font-medium">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {todayAppts.map((appt) => (
                  <tr
                    key={appt.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-medium">
                      {format(new Date(appt.scheduledAt), "h:mm a")}
                    </td>
                    <td className="py-2.5 pr-4">{appt.patientName}</td>
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {appt.doctorName}
                    </td>
                    <td className="py-2.5 pr-4 capitalize text-muted-foreground">
                      {appt.type}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[appt.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
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

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="text-primary">{icon}</span>
        <span>{label}</span>
      </div>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
