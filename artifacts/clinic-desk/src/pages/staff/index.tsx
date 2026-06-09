import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { showErrorToast } from "@/lib/error";

const STAFF_ROLES = ["admin", "doctor", "receptionist"] as const;
type StaffRole = (typeof STAFF_ROLES)[number];

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().optional(),
  role: z.enum(STAFF_ROLES),
  specialty: z.string().optional(),
  phone: z.string().optional(),
});

type UserFormValues = z.infer<typeof userSchema>;

type StaffUser = {
  id: number;
  name: string;
  email: string;
  role: StaffRole;
  specialty: string | null;
  phone: string | null;
  createdAt: string;
};

type StaffResponse = {
  data: StaffUser[];
  total: number;
  page: number;
  limit: number;
  summary: Record<StaffRole, number>;
};

export default function StaffPage() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "">("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (roleFilter) params.set("role", roleFilter);
    params.set("page", String(page));
    params.set("limit", String(limit));
    params.set("sort", "createdAt");
    params.set("order", "desc");
    return params.toString();
  }, [search, roleFilter, page]);

  const { data, isLoading } = useQuery({
    queryKey: ["users", { search, roleFilter, page, limit }],
    queryFn: async () => {
      const res = await api.get<StaffResponse>(`/users${queryString ? `?${queryString}` : ""}`);
      return res.data;
    },
  });

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", role: "doctor", password: "", specialty: "", phone: "" },
  });

  const mutation = useMutation({
    mutationFn: async (payload: UserFormValues) => {
      const dataToSend = {
        ...payload,
        specialty: payload.specialty || undefined,
        phone: payload.phone || undefined,
        password: payload.password || undefined,
      };

      if (editingUser) {
        return await api.patch(`/users/${editingUser.id}`, dataToSend);
      }
      return await api.post("/users", dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(editingUser ? "User updated" : "User created");
      setIsOpen(false);
    },
    onError: (error: any) => {
      showErrorToast(error, "An error occurred");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
    },
  });

  const openEdit = (user: StaffUser) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role,
      specialty: user.specialty || "",
      phone: user.phone || "",
      password: "",
    });
    setIsOpen(true);
  };

  const openNew = () => {
    setEditingUser(null);
    form.reset({ name: "", email: "", role: "doctor", password: "", specialty: "", phone: "" });
    setIsOpen(true);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const summary = data?.summary ?? { admin: 0, doctor: 0, receptionist: 0 };
  const staff = data?.data ?? [];

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage clinic staff only. Patients are excluded everywhere on this page.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}>
              <Plus className="mr-2 h-4 w-4" /> Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((payload) => {
                  if (!editingUser && !payload.password) {
                    toast.error("Password is required for new staff members");
                    return;
                  }
                  mutation.mutate(payload);
                })}
                className="space-y-4"
              >
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password {editingUser ? "(Leave blank to keep current)" : ""}</FormLabel>
                    <FormControl><Input type="password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="receptionist">Receptionist</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                {form.watch("role") === "doctor" && (
                  <FormField control={form.control} name="specialty" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialty</FormLabel>
                      <FormControl><Input {...field} placeholder="General Medicine" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input {...field} placeholder="+1234567890" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Staff</p>
            <p className="text-2xl font-bold text-foreground">{data?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Admins</p>
            <p className="text-2xl font-bold text-foreground">{summary.admin ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Doctors</p>
            <p className="text-2xl font-bold text-foreground">{summary.doctor ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Receptionists</p>
            <p className="text-2xl font-bold text-foreground">{summary.receptionist ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search staff by name, email, specialty, or phone"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            type="button"
            variant={roleFilter === "" ? "default" : "outline"}
            onClick={() => { setRoleFilter(""); setPage(1); }}
          >
            All Staff
          </Button>
          {STAFF_ROLES.map((role) => (
            <Button
              key={role}
              type="button"
              variant={roleFilter === role ? "default" : "outline"}
              onClick={() => { setRoleFilter(role); setPage(1); }}
              className="capitalize"
            >
              {role}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : !staff.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No staff found</TableCell>
                </TableRow>
              ) : (
                staff.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{user.role}</Badge>
                    </TableCell>
                    <TableCell>{user.specialty || "-"}</TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure?")) deleteMutation.mutate(user.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {data?.page ?? 1} of {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
