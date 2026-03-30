import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Building2, UserCheck, UserX, Users } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useActor } from "../hooks/useActor";

const SHIFT_COLORS = ["#3B82F6", "#06B6D4", "#8B5CF6", "#F59E0B"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function DashboardPage() {
  const { actor, isFetching } = useActor();
  const [date, setDate] = useState(todayStr());

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats", date],
    queryFn: () => actor!.getDashboardStats(date),
    enabled: !!actor && !isFetching,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => actor!.getAllVendors(),
    enabled: !!actor && !isFetching,
  });

  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  const kpiCards = [
    {
      label: "Total Employees",
      value: stats ? Number(stats.totalEmployees) : 0,
      icon: Users,
      color: "oklch(0.55 0.22 264)",
      bg: "oklch(0.55 0.22 264 / 0.08)",
    },
    {
      label: "Present Today",
      value: stats ? Number(stats.presentCount) : 0,
      icon: UserCheck,
      color: "oklch(0.62 0.19 142)",
      bg: "oklch(0.62 0.19 142 / 0.08)",
    },
    {
      label: "Absent Today",
      value: stats ? Number(stats.absentCount) : 0,
      icon: UserX,
      color: "oklch(0.63 0.24 25)",
      bg: "oklch(0.63 0.24 25 / 0.08)",
    },
    {
      label: "Attendance %",
      value: stats ? `${stats.attendancePercentage.toFixed(1)}%` : "0%",
      icon: Building2,
      color: "oklch(0.78 0.17 80)",
      bg: "oklch(0.78 0.17 80 / 0.08)",
    },
  ];

  const pieData = [
    { name: "Present", value: stats ? Number(stats.presentCount) : 0 },
    { name: "Absent", value: stats ? Number(stats.absentCount) : 0 },
  ];
  const PIE_COLORS = ["#22C55E", "#EF4444"];

  const vendorBarData = (stats?.vendorDistribution ?? []).map(
    ([vendorId, count]) => ({
      name: vendorMap[vendorId] ?? vendorId.slice(0, 8),
      count: Number(count),
    }),
  );

  const shiftBarData = (stats?.shiftDistribution ?? []).map(
    ([shift, count]) => ({
      shift: `Shift ${shift}`,
      count: Number(count),
      color: SHIFT_COLORS["ABCD".indexOf(shift)] ?? SHIFT_COLORS[0],
    }),
  );

  const SKELETONS = ["s1", "s2", "s3", "s4"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Showing stats for:</p>
        <Input
          data-ocid="dashboard.date.input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44 text-sm bg-card"
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card, i) => (
          <Card
            key={card.label}
            data-ocid={`dashboard.kpi.item.${i + 1}`}
            className="shadow-card border-border"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {card.label}
                  </p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground">
                      {card.value}
                    </p>
                  )}
                </div>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: card.bg }}
                >
                  <card.icon
                    className="h-5 w-5"
                    style={{ color: card.color }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.attendance.chart"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Present vs Absent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={entry.name} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card
          className="shadow-card border-border"
          data-ocid="dashboard.vendor.chart"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Vendor-wise Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div data-ocid="dashboard.vendor.loading_state">
                {SKELETONS.map((k) => (
                  <Skeleton key={k} className="h-10 w-full mb-2" />
                ))}
              </div>
            ) : vendorBarData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
                No vendor data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={vendorBarData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shift distribution */}
      <Card
        className="shadow-card border-border"
        data-ocid="dashboard.shift.chart"
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Shift-wise Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : shiftBarData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
              No shift data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={shiftBarData}
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="shift" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
