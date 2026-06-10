import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/contexts/I18nContext";
import { ErrorCard } from "@/components/ui/error-card";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard");
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: unknown) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: decorative panel */}
      <div className="hidden lg:flex w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <span className="text-white font-bold text-base">C</span>
          </div>
          <span className="text-sidebar-foreground font-bold text-xl tracking-tight">ClinicDesk</span>
        </div>
        <div>
          <blockquote className="text-sidebar-foreground/80 text-2xl font-medium leading-snug mb-6">
            "Precision, care, and efficiency — all in one place for modern healthcare teams."
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Patients", value: "1,200+" },
              { label: "Appointments / day", value: "80+" },
              { label: "Doctors", value: "12" },
              { label: "Revenue tracked", value: "$250K+" },
            ].map(stat => (
              <div key={stat.label} className="bg-sidebar-accent rounded-xl p-4">
                <p className="text-sidebar-primary-foreground text-xl font-bold">{stat.value}</p>
                <p className="text-sidebar-foreground/50 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sidebar-foreground/30 text-sm">&copy; 2026 ClinicDesk</p>
      </div>

      {/* Right: login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground text-sm mt-1">Sign in to your ClinicDesk account</p>
          </div>

          <ErrorCard error={error} title="Unable to sign in" />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("email")}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                placeholder="you@clinic.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("password")}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? t("loading") : t("login")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
