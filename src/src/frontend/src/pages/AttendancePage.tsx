import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Users, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Attendance } from "../backend";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function AttendancePage() {
  const { actor, isFetching } = useActor();
  const { user } = useAppAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [saving, setSaving] = useState<Set<string>>(new Set());

  const canEdit = user?.permissions === "edit";

  const { data: employees = [], isLoading: empLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: () => actor!.getAllEmployees(),
    enabled: !!actor && !isFetching,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => actor!.getAllVendors(),
    enabled: !!actor && !isFetching,
  });

  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));

  const { data: attendance = [], isLoading: attLoading } = useQuery({
    queryKey: ["attendance", date],
    queryFn: () => actor!.getAttendanceByDate(date),
    enabled: !!actor && !isFetching,
  });

  const attendanceMap = useMemo(
    () => Object.fromEntries(attendance.map((a) => [a.employeeId, a])),
    [attendance],
  );

  async function markStatus(employeeId: string, status: string) {
    if (!actor || !canEdit) return;
    setSaving((prev) => new Set(prev).add(employeeId));
    try {
      const existing = attendanceMap[employeeId];
      const record: Attendance = {
        id: existing?.id ?? crypto.randomUUID(),
        employeeId,
        date,
        status,
      };
      if (existing) {
        await actor.updateAttendance(record);
      } else {
        await actor.markAttendance(record);
      }
      await qc.invalidateQueries({ queryKey: ["attendance", date] });
      toast.success(`Marked ${status}`);
    } catch {
      toast.error("Failed to mark attendance");
    } finally {
      setSaving((prev) => {
        const s = new Set(prev);
        s.delete(employeeId);
        return s;
      });
    }
  }

  async function markAll(status: string) {
    if (!actor || !canEdit) return;
    const promises = employees.map(async (emp) => {
      const existing = attendanceMap[emp.id];
      const record: Attendance = {
        id: existing?.id ?? crypto.randomUUID(),
        employeeId: emp.id,
        date,
        status,
      };
      if (existing) {
        return actor.updateAttendance(record);
      }
      return actor.markAttendance(record);
    });
    try {
      await Promise.all(promises);
      await qc.invalidateQueries({ queryKey: ["attendance", date] });
      toast.success(`All employees marked ${status}`);
    } catch {
      toast.error("Failed to mark all attendance");
    }
  }

  const isLoading = empLoading || attLoading;
  const presentCount = attendance.filter((a) => a.status === "Present").length;
  const absentCount = attendance.filter((a) => a.status === "Absent").length;

  return (
    <div className="space-y-5">
      <Card className="shadow-card border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-base font-semibold">
                  Daily Attendance
                </CardTitle>
                {!canEdit && (
                  <Badge variant="secondary" className="text-xs">
                    Read Only
                  </Badge>
                )}
              </div>
              <div className="flex gap-3 mt-1.5">
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-green-600">
                    {presentCount}
                  </span>{" "}
                  Present
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-red-500">
                    {absentCount}
                  </span>{" "}
                  Absent
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {employees.length - presentCount - absentCount}
                  </span>{" "}
                  Not Marked
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                data-ocid="attendance.date.input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-40 h-9 text-sm bg-card"
              />
              {canEdit && (
                <>
                  <Button
                    data-ocid="attendance.mark_all_present.button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => markAll("Present")}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> All Present
                  </Button>
                  <Button
                    data-ocid="attendance.mark_all_absent.button"
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => markAll("Absent")}
                  >
                    <XCircle className="h-3.5 w-3.5" /> All Absent
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="attendance.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div
              data-ocid="attendance.empty_state"
              className="py-16 text-center"
            >
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No employees to mark attendance for.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="attendance.table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">
                      Employee
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Code
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Company
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Shift
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Status
                    </TableHead>
                    {canEdit && (
                      <TableHead className="text-xs font-semibold text-right">
                        Action
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp, idx) => {
                    const att = attendanceMap[emp.id];
                    const status = att?.status;
                    const isSavingThis = saving.has(emp.id);
                    return (
                      <TableRow
                        key={emp.id}
                        data-ocid={`attendance.item.${idx + 1}`}
                      >
                        <TableCell className="font-medium text-sm">
                          {emp.name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground font-mono">
                          {emp.code}
                        </TableCell>
                        <TableCell className="text-sm">
                          {vendorMap[emp.vendorId] ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          Shift {emp.shift}
                        </TableCell>
                        <TableCell>
                          {status === "Present" ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 text-xs">
                              Present
                            </Badge>
                          ) : status === "Absent" ? (
                            <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-0 text-xs">
                              Absent
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Not Marked
                            </Badge>
                          )}
                        </TableCell>
                        {canEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                data-ocid={`attendance.present.button.${idx + 1}`}
                                size="sm"
                                variant={
                                  status === "Present" ? "default" : "outline"
                                }
                                className={`h-7 text-xs px-2.5 ${
                                  status === "Present"
                                    ? "bg-green-600 hover:bg-green-700 border-0"
                                    : "border-green-200 text-green-700 hover:bg-green-50"
                                }`}
                                disabled={isSavingThis}
                                onClick={() => markStatus(emp.id, "Present")}
                              >
                                {isSavingThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "P"
                                )}
                              </Button>
                              <Button
                                data-ocid={`attendance.absent.button.${idx + 1}`}
                                size="sm"
                                variant={
                                  status === "Absent" ? "default" : "outline"
                                }
                                className={`h-7 text-xs px-2.5 ${
                                  status === "Absent"
                                    ? "bg-red-500 hover:bg-red-600 border-0"
                                    : "border-red-200 text-red-600 hover:bg-red-50"
                                }`}
                                disabled={isSavingThis}
                                onClick={() => markStatus(emp.id, "Absent")}
                              >
                                {isSavingThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  "A"
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
