import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { BarChart3, CalendarCheck, Loader2, Shield, Users } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";

export default function LoginPage() {
  const { actor } = useActor();
  const { login } = useAppAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const features = [
    {
      icon: Users,
      label: "Employee Management",
      desc: "Full CRUD with search & filters",
    },
    {
      icon: BarChart3,
      label: "Analytics Dashboard",
      desc: "Real-time KPIs and charts",
    },
    {
      icon: CalendarCheck,
      label: "Attendance Tracking",
      desc: "Daily attendance with history",
    },
    {
      icon: Shield,
      label: "Role-Based Access",
      desc: "Admin & User role support",
    },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter your User ID and Password.");
      return;
    }
    if (!actor) {
      setError("Connecting to server, please wait...");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      const user = await actor.appLogin(username.trim(), password);
      if (user) {
        login(user);
        navigate({ to: "/dashboard" });
      } else {
        setError("Invalid User ID or Password.");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ background: "oklch(var(--background))" }}
    >
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] p-12"
        style={{ background: "oklch(var(--sidebar))" }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "oklch(var(--sidebar-primary))" }}
            >
              <Users className="h-5 w-5 text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: "oklch(var(--sidebar-foreground))" }}
            >
              HRMS Portal
            </span>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1
              className="text-4xl font-bold leading-tight mb-4"
              style={{ color: "oklch(var(--sidebar-foreground))" }}
            >
              Manage Your Workforce with Confidence
            </h1>
            <p
              className="text-base leading-relaxed"
              style={{ color: "oklch(0.65 0.03 255)" }}
            >
              A complete Human Resource Management System — secure, persistent,
              and always available.
            </p>
          </motion.div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              className="p-4 rounded-xl"
              style={{ background: "oklch(var(--sidebar-accent))" }}
            >
              <f.icon
                className="h-5 w-5 mb-2"
                style={{ color: "oklch(var(--sidebar-primary))" }}
              />
              <p
                className="text-sm font-semibold mb-0.5"
                style={{ color: "oklch(var(--sidebar-foreground))" }}
              >
                {f.label}
              </p>
              <p className="text-xs" style={{ color: "oklch(0.65 0.03 255)" }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-card rounded-2xl p-8 shadow-card border border-border">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(var(--primary))" }}
              >
                <Users className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">
                HRMS Portal
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Sign in with your User ID and Password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="login-username">User ID</Label>
                <Input
                  id="login-username"
                  data-ocid="login.username.input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your User ID"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  data-ocid="login.password.input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>
              {error && (
                <p
                  data-ocid="login.error_state"
                  className="text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <Button
                data-ocid="login.primary_button"
                type="submit"
                size="lg"
                className="w-full font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()}. Built with love using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
