import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, Calendar } from "lucide-react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export default function ReportsPage() {
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["reports", "revenue"],
    queryFn: async () => {
      const res = await api.get("/reports/revenue");
      return res.data;
    },
  });

  const { data: patients, isLoading: patLoading } = useQuery({
    queryKey: ["reports", "patients"],
    queryFn: async () => {
      const res = await api.get("/reports/patients");
      return res.data;
    },
  });

  const { data: appointments, isLoading: appLoading } = useQuery({
    queryKey: ["reports", "appointments"],
    queryFn: async () => {
      const res = await api.get("/reports/appointments");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">High-level clinic performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {revLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">${parseFloat(revenue?.total || "0").toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground text-green-600 mt-1">Paid: ${parseFloat(revenue?.paid || "0").toFixed(2)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {patLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{patients?.count || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {appLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">
                {appointments?.reduce((acc: number, curr: any) => acc + parseInt(curr.count), 0) || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All time total</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointments by Status</CardTitle>
            <CardDescription>Distribution of appointment states</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {appLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={appointments}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {appointments?.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Appointments Bar Chart</CardTitle>
            <CardDescription>Visual distribution by status</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {appLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={appointments}>
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
