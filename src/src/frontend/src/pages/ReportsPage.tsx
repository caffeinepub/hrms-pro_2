import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5"];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function monthStartStr() {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().split("T")[0];
}

type ReportRow = {
  "Employee Name": string;
  Code: string;
  Vendor: string;
  Shift: string;
  Date: string;
  Status: string;
};

function exportCSV(rows: ReportRow[], filename: string) {
  if (rows.length === 0) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]) as (keyof ReportRow)[];
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${String(row[h]).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Report exported");
}

export default function ReportsPage() {
  const { actor, isFetching } = useActor();
  const [dateFrom, setDateFrom] = useState(monthStartStr());
  const [dateTo, setDateTo] = useState(todayStr());
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterShift, setFilterShift] = useState("all");

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

  const { data: allAttendance = [], isLoading: attLoading } = useQuery({
    queryKey: ["allAttendance"],
    queryFn: () => actor!.getAllAttendance(),
    enabled: !!actor && !isFetching,
  });

  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name]));
  const employeeMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const filteredRows = useMemo<ReportRow[]>(() => {
    return allAttendance
      .filter((att) => {
        const inRange = att.date >= dateFrom && att.date <= dateTo;
        const emp = employeeMap[att.employeeId];
        if (!emp) return false;
        const matchVendor =
          filterVendor === "all" || emp.vendorId === filterVendor;
        const matchShift = filterShift === "all" || emp.shift === filterShift;
        return inRange && matchVendor && matchShift;
      })
      .map((att) => {
        const emp = employeeMap[att.employeeId];
        return {
          "Employee Name": emp?.name ?? "-",
          Code: emp?.code ?? "-",
          Vendor: vendorMap[emp?.vendorId ?? ""] ?? "-",
          Shift: emp ? `Shift ${emp.shift}` : "-",
          Date: att.date,
          Status: att.status,
        };
      })
      .sort((a, b) => b.Date.localeCompare(a.Date));
  }, [
    allAttendance,
    dateFrom,
    dateTo,
    filterVendor,
    filterShift,
    employeeMap,
    vendorMap,
  ]);

  const presentCount = filteredRows.filter(
    (r) => r.Status === "Present",
  ).length;
  const absentCount = filteredRows.filter((r) => r.Status === "Absent").length;
  const isLoading = empLoading || attLoading;
  const ROW_HEADERS = Object.keys(filteredRows[0] ?? {}) as (keyof ReportRow)[];

  return (
    <div className="space-y-5">
      <Card className="shadow-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">From Date</Label>
              <Input
                data-ocid="reports.date_from.input"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Date</Label>
              <Input
                data-ocid="reports.date_to.input"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Vendor</Label>
              <Select value={filterVendor} onValueChange={setFilterVendor}>
                <SelectTrigger
                  data-ocid="reports.vendor.select"
                  className="h-9 text-sm"
                >
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Shift</Label>
              <Select value={filterShift} onValueChange={setFilterShift}>
                <SelectTrigger
                  data-ocid="reports.shift.select"
                  className="h-9 text-sm"
                >
                  <SelectValue placeholder="All Shifts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  {["A", "B", "C", "D"].map((s) => (
                    <SelectItem key={s} value={s}>
                      Shift {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-5">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">
              {filteredRows.length}
            </p>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </div>
        </div>
        <Button
          data-ocid="reports.export.button"
          onClick={() =>
            exportCSV(filteredRows, `hrms-report-${dateFrom}-to-${dateTo}.csv`)
          }
          className="gap-2"
          disabled={filteredRows.length === 0}
        >
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      <Card className="shadow-card border-border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="reports.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredRows.length === 0 ? (
            <div data-ocid="reports.empty_state" className="py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No records found for selected filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="reports.table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {ROW_HEADERS.map((h) => (
                      <TableHead key={h} className="text-xs font-semibold">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.slice(0, 100).map((row, idx) => (
                    <TableRow
                      key={`${row.Code}-${row.Date}`}
                      data-ocid={`reports.item.${idx + 1}`}
                    >
                      {ROW_HEADERS.map((h) => (
                        <TableCell key={h} className="text-sm">
                          {h === "Status" ? (
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                row[h] === "Present"
                                  ? "bg-green-100 text-green-700 border-0"
                                  : "bg-red-100 text-red-600 border-0"
                              }`}
                            >
                              {row[h]}
                            </Badge>
                          ) : (
                            row[h]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredRows.length > 100 && (
                <p className="text-center py-3 text-xs text-muted-foreground">
                  Showing 100 of {filteredRows.length} records. Export to see
                  all.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
