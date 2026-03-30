import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import { AppAuthProvider, useAppAuth } from "./hooks/useAppAuth";
import AttendancePage from "./pages/AttendancePage";
import CompanyProfilePage from "./pages/CompanyProfilePage";
import DashboardPage from "./pages/DashboardPage";
import EmployeeProfilePage from "./pages/EmployeeProfilePage";
import EmployeesPage from "./pages/EmployeesPage";
import LoginPage from "./pages/LoginPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import VendorsPage from "./pages/VendorsPage";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: () => (
    <Layout>
      <DashboardPage />
    </Layout>
  ),
});

const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employees",
  component: () => (
    <Layout>
      <EmployeesPage />
    </Layout>
  ),
});

const employeeProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employees/$id",
  component: () => (
    <Layout>
      <EmployeeProfilePage />
    </Layout>
  ),
});

const vendorsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vendors",
  component: () => (
    <Layout>
      <VendorsPage />
    </Layout>
  ),
});

const companyProfileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/vendors/$id",
  component: () => (
    <Layout>
      <CompanyProfilePage />
    </Layout>
  ),
});

const attendanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/attendance",
  component: () => (
    <Layout>
      <AttendancePage />
    </Layout>
  ),
});

const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: () => (
    <Layout>
      <ReportsPage />
    </Layout>
  ),
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: () => (
    <Layout>
      <UsersPage />
    </Layout>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  employeesRoute,
  employeeProfileRoute,
  vendorsRoute,
  companyProfileRoute,
  attendanceRoute,
  reportsRoute,
  usersRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function AppContent() {
  const { user } = useAppAuth();

  if (!user) {
    return (
      <>
        <LoginPage />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AppAuthProvider>
      <AppContent />
    </AppAuthProvider>
  );
}
