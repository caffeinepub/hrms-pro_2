import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, User } from "lucide-react";
import { useActor } from "../hooks/useActor";

const SHIFT_LABELS: Record<string, string> = {
  A: "Shift A (6AM–2PM)",
  B: "Shift B (2PM–10PM)",
  C: "Shift C (10PM–6AM)",
  D: "Shift D (Custom)",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2">
      <span className="text-sm text-muted-foreground w-40 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function EmployeeProfilePage() {
  const { id } = useParams({ from: "/employees/$id" });
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();

  const { data: employee, isLoading: empLoading } = useQuery({
    queryKey: ["employee", id],
    queryFn: () => actor!.getEmployee(id),
    enabled: !!actor && !isFetching,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => actor!.getAllVendors(),
    enabled: !!actor && !isFetching,
  });

  const { data: attendance = [] } = useQuery({
    queryKey: ["attendance", "employee", id],
    queryFn: () => actor!.getAttendanceByEmployee(id),
    enabled: !!actor && !isFetching,
  });

  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  const presentCount = attendance.filter((a) => a.status === "Present").length;
  const absentCount = attendance.filter((a) => a.status === "Absent").length;
  const attendancePct =
    attendance.length > 0
      ? Math.round((presentCount / attendance.length) * 100)
      : null;

  if (empLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Employee not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/employees" })}
        >
          Back to Employees
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/employees" })}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-lg font-semibold">Employee Profile</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {employee.photo ? (
              <img
                src={employee.photo}
                alt={employee.name}
                className="h-24 w-24 rounded-full object-cover border shrink-0"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <User className="h-10 w-10 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold">{employee.name}</h2>
              <p className="text-muted-foreground text-sm">
                {employee.designation || "No designation"}
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{employee.code}</Badge>
                {employee.department && (
                  <Badge variant="outline">{employee.department}</Badge>
                )}
                <Badge className="bg-blue-100 text-blue-700 border-0">
                  {SHIFT_LABELS[employee.shift] ?? employee.shift}
                </Badge>
                <Badge
                  className={`border-0 ${
                    employee.employeeType === "Casual"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {employee.employeeType || "Permanent"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow label="Full Name" value={employee.name} />
            <Separator />
            <InfoRow label="Phone Number" value={employee.phoneNumber} />
            <Separator />
            <InfoRow label="Parent's Name" value={employee.parentsName} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Work Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow label="Employee Code" value={employee.code} />
            <Separator />
            <InfoRow
              label="Company"
              value={vendorMap[employee.vendorId] ?? "—"}
            />
            <Separator />
            <InfoRow label="Department" value={employee.department} />
            <Separator />
            <InfoRow label="Designation" value={employee.designation} />
            <Separator />
            <InfoRow label="Joining Date" value={employee.joiningDate} />
            <Separator />
            <InfoRow
              label="Shift"
              value={SHIFT_LABELS[employee.shift] ?? employee.shift}
            />
            <Separator />
            <InfoRow
              label="Employee Type"
              value={employee.employeeType || "Permanent"}
            />
          </CardContent>
        </Card>
      </div>

      {attendance.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-6 py-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {presentCount}
                </p>
                <p className="text-xs text-muted-foreground">Present</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{absentCount}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </div>
              {attendancePct !== null && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {attendancePct}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Attendance Rate
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
