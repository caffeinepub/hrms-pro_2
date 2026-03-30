import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  CalendarCheck,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCog,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useAppAuth } from "../hooks/useAppAuth";

const baseNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/employees", label: "Employees", icon: Users },
  { to: "/vendors", label: "Companies", icon: Building2 },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck },
  { to: "/reports", label: "Reports", icon: FileBarChart },
];

const adminNavItems = [{ to: "/users", label: "Users", icon: UserCog }];

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAppAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? [...baseNavItems, ...adminNavItems] : baseNavItems;

  const allNavItems = [...baseNavItems, ...adminNavItems];
  const currentLabel =
    allNavItems.find(
      (n) => currentPath === n.to || currentPath.startsWith(`${n.to}/`),
    )?.label ?? "Dashboard";

  const initials = user?.username?.slice(0, 2).toUpperCase() ?? "??";

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-center px-4 py-4 border-b"
        style={{ borderColor: "oklch(var(--sidebar-border))" }}
      >
        <img
          src="/assets/uploads/cel-019d3cff-d685-7304-a281-62d58d9d6604-1.png"
          alt="CEL Logo"
          className="h-16 w-auto object-contain"
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            currentPath === item.to || currentPath.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={`nav.${item.label.toLowerCase().replace(" ", "_")}.link`}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
              )}
              style={{
                background: active
                  ? "oklch(var(--sidebar-primary))"
                  : "transparent",
                color: active ? "white" : "oklch(0.65 0.03 255)",
              }}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "oklch(var(--sidebar-border))" }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2"
          style={{ background: "oklch(var(--sidebar-accent))" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "oklch(var(--sidebar-primary))" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-medium truncate"
              style={{ color: "oklch(var(--sidebar-foreground))" }}
            >
              {user?.username}
            </p>
            <div className="flex gap-1 mt-0.5">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-0"
                style={{
                  background: isAdmin
                    ? "oklch(0.55 0.22 264 / 0.2)"
                    : "oklch(0.72 0.19 142 / 0.15)",
                  color: isAdmin
                    ? "oklch(0.7 0.15 264)"
                    : "oklch(0.6 0.15 142)",
                }}
              >
                {isAdmin ? "Admin" : "User"}
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4 border-0"
                style={{
                  background:
                    user?.permissions === "edit"
                      ? "oklch(0.65 0.2 50 / 0.15)"
                      : "oklch(0.6 0.03 255 / 0.15)",
                  color:
                    user?.permissions === "edit"
                      ? "oklch(0.55 0.2 50)"
                      : "oklch(0.5 0.05 255)",
                }}
              >
                {user?.permissions === "edit" ? "Edit" : "View"}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          data-ocid="nav.logout.button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-xs font-medium"
          style={{ color: "oklch(0.65 0.03 255)" }}
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0"
        style={{ background: "oklch(var(--sidebar))" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: overlay backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            role="presentation"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className="relative z-10 w-64 flex flex-col"
            style={{ background: "oklch(var(--sidebar))" }}
          >
            <button
              type="button"
              className="absolute top-4 right-4 text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">
              {currentLabel}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "oklch(var(--primary))" }}
            >
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
