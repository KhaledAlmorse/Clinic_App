import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import {
  LayoutDashboard, Users, Calendar, ClipboardList,
  FileText, Receipt, LogOut, Globe, Menu, X, Bell, Check, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListNotifications, useUnreadCount, useMarkAsRead } from "@/hooks/useNotifications";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { href: "/dashboard", label: "dashboard", icon: <LayoutDashboard size={18} />, roles: ["admin", "doctor", "receptionist", "patient"] },
  { href: "/patients", label: "patients", icon: <Users size={18} />, roles: ["admin", "receptionist", "doctor"] },
  { href: "/appointments", label: "appointments", icon: <Calendar size={18} />, roles: ["admin", "doctor", "receptionist", "patient"] },
  { href: "/visits", label: "visits", icon: <ClipboardList size={18} />, roles: ["admin", "doctor", "receptionist"] },
  { href: "/prescriptions", label: "prescriptions", icon: <FileText size={18} />, roles: ["admin", "doctor", "patient"] },
  { href: "/invoices", label: "invoices", icon: <Receipt size={18} />, roles: ["admin", "receptionist"] },
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const [location] = useLocation();
  const { t } = useI18n();
  const isActive = location.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
        isActive && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      {!collapsed && <span>{t(item.label)}</span>}
    </Link>
  );
}

function NotificationBell() {
  const { data: notificationsData } = useListNotifications();
  const { data: unreadData } = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const [open, setOpen] = useState(false);

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notificationsData?.data ?? [];

  const handleMarkRead = (id: number) => {
    markAsRead.mutate(id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment_reminder":
        return <Calendar className="text-blue-500 shrink-0" size={16} />;
      case "payment_alert":
        return <Receipt className="text-emerald-500 shrink-0" size={16} />;
      case "follow_up":
        return <ClipboardList className="text-purple-500 shrink-0" size={16} />;
      default:
        return <Info className="text-muted-foreground shrink-0" size={16} />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-foreground/70 hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card border border-card-border rounded-xl shadow-xl z-50 flex flex-col focus:outline-none animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="divide-y divide-border overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkRead(n.id)}
                    className={cn(
                      "p-3.5 flex items-start gap-3 transition-colors cursor-pointer text-left",
                      n.read ? "hover:bg-muted/30" : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    {getIcon(n.type)}
                    <div className="flex-1 space-y-0.5 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <p className={cn("text-xs font-semibold text-foreground truncate", !n.read && "font-bold")}>
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 pt-0.5">
                        {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();

  const navItems = allNavItems.filter(item =>
    user ? item.roles.includes(user.role) : false
  );

  const roleLabel = {
    admin: "Administrator",
    doctor: "Doctor",
    receptionist: "Receptionist",
    patient: "Patient",
  }[user?.role ?? "patient"] ?? "User";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 shrink-0",
        sidebarOpen ? "w-60" : "w-16"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-sidebar-primary flex items-center justify-center">
                <span className="text-xs font-bold text-white">C</span>
              </div>
              <span className="font-bold text-base tracking-tight">ClinicDesk</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.href} item={item} collapsed={!sidebarOpen} />
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium",
              "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
            )}
          >
            <Globe size={15} />
            {sidebarOpen && <span>{lang === "en" ? "العربية" : "English"}</span>}
          </button>

          {sidebarOpen && (
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/50">{roleLabel}</p>
            </div>
          )}

          <button
            onClick={() => logout()}
            className={cn(
              "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium",
              "text-sidebar-foreground/60 hover:text-destructive hover:bg-sidebar-accent transition-colors"
            )}
          >
            <LogOut size={15} />
            {sidebarOpen && <span>{t("logout")}</span>}
          </button>
        </div>
      </aside>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground/80 capitalize">
              {location.split("/")[1] || "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
