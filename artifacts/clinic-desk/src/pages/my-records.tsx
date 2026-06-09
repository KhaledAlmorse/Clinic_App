import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Pill, FileText } from "lucide-react";

export default function MyRecordsPage() {
  const { user } = useAuth();

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["patient", "by-user", user?.id],
    queryFn: async () => {
      const res = await api.get(`/patients/by-user/${user?.id}`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const { data: appointments, isLoading: apptsLoading } = useQuery({
    queryKey: ["appointments", "patient", patient?.id],
    queryFn: async () => {
      const res = await api.get(`/appointments?patientId=${patient.id}`);
      return res.data.data;
    },
    enabled: !!patient?.id,
  });

  if (patientLoading) {
    return <div className="p-8"><Skeleton className="h-10 w-1/3 mb-6" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Your user account is not linked to a patient profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Records</h1>
        <p className="text-muted-foreground">Welcome back, {patient.name}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Appointments Widget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {apptsLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : appointments?.length > 0 ? (
              <div className="space-y-4">
                {appointments.slice(0, 5).map((appt: any) => (
                  <div key={appt.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{format(new Date(appt.scheduledAt), "MMM d, yyyy 'at' h:mm a")}</p>
                      <p className="text-sm text-muted-foreground capitalize">{appt.type}</p>
                    </div>
                    <Badge variant={appt.status === "confirmed" ? "default" : "secondary"}>
                      {appt.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            )}
          </CardContent>
        </Card>

        {/* Profile Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Email:</span> <span className="font-medium">{patient.email}</span></div>
            <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{patient.phone}</span></div>
            <div className="flex justify-between py-1 border-b"><span className="text-muted-foreground">Blood Type:</span> <span className="font-medium">{patient.bloodType || "N/A"}</span></div>
            <div className="flex justify-between py-1"><span className="text-muted-foreground">Allergies:</span> <span className="font-medium text-destructive">{patient.allergies || "None"}</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
