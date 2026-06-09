import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Calendar, Shield, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <Activity className="h-6 w-6 text-primary" />
            <span>ClinicDesk</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild variant="default">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Book Appointment</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 md:py-32 md:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl/none">
                  Modern Healthcare, <br />
                  <span className="text-primary">Simplified.</span>
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl leading-relaxed">
                  Experience seamless appointment booking, secure medical records access, and top-tier clinical care—all in one place.
                </p>
              </div>
              <div className="flex flex-col gap-3 min-[400px]:flex-row">
                <Button asChild size="lg" className="h-12 px-8">
                  <Link href="/register">Get Started as a Patient</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-8">
                  <Link href="/login">Staff Login</Link>
                </Button>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[500px] lg:max-w-none">
              <div className="aspect-square overflow-hidden rounded-3xl border bg-muted shadow-2xl relative group">
                <img
                  alt="Doctor with patient"
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                  src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=2000&auto=format&fit=crop"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent mix-blend-multiply" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/50 py-24">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Why Choose ClinicDesk?</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Our platform provides state-of-the-art tools for both healthcare professionals and patients.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-background border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Easy Scheduling</h3>
                  <p className="text-muted-foreground">Book and manage your appointments 24/7 with real-time availability.</p>
                </CardContent>
              </Card>
              <Card className="bg-background border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Secure Records</h3>
                  <p className="text-muted-foreground">Your medical history is encrypted and securely accessible only by you and your doctor.</p>
                </CardContent>
              </Card>
              <Card className="bg-background border-none shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-8 flex flex-col items-center text-center space-y-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Top Specialists</h3>
                  <p className="text-muted-foreground">Connect with our network of experienced and highly-rated healthcare professionals.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-4 md:px-8 text-center text-sm text-muted-foreground">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Activity className="h-5 w-5" />
            <span className="font-semibold text-foreground">ClinicDesk</span>
          </div>
          <p>© {new Date().getFullYear()} ClinicDesk. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
