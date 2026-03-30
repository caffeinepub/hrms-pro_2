import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import type { Employee } from "../backend";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";

const SHIFTS = ["A", "B", "C", "D"];
const SHIFT_LABELS: Record<string, string> = {
  A: "Shift A (6AM–2PM)",
  B: "Shift B (2PM–10PM)",
  C: "Shift C (10PM–6AM)",
  D: "Shift D (Custom)",
};
const EMPLOYEE_TYPES = ["Permanent", "Casual"];
const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4", "sk5"];

function emptyForm() {
  return {
    name: "",
    code: "",
    vendorId: "",
    shift: "A",
    parentsName: "",
    phoneNumber: "",
    department: "",
    designation: "",
    joiningDate: "",
    photo: "",
    employeeType: "Permanent",
    inTime: "",
    outTime: "",
  };
}

export default function EmployeesPage() {
  const { actor, isFetching } = useActor();
  const { user } = useAppAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const canEdit = user?.permissions === "edit";

  const { data: employees = [], isLoading } = useQuery({
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

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchesSearch =
        !search ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase());
      const matchesVendor =
        filterVendor === "all" || e.vendorId === filterVendor;
      const matchesShift = filterShift === "all" || e.shift === filterShift;
      return matchesSearch && matchesVendor && matchesShift;
    });
  }, [employees, search, filterVendor, filterShift]);

  const addMutation = useMutation({
    mutationFn: (emp: Employee) => actor!.addEmployee(emp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee added successfully");
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to add employee"),
  });

  const updateMutation = useMutation({
    mutationFn: (emp: Employee) => actor!.updateEmployee(emp),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee updated successfully");
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update employee"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => actor!.deleteEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete employee"),
  });

  function openAdd() {
    setEditEmployee(null);
    setForm(emptyForm());
    setErrors({});
    setDialogOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditEmployee(emp);
    setForm({
      name: emp.name,
      code: emp.code,
      vendorId: emp.vendorId,
      shift: emp.shift,
      parentsName: emp.parentsName,
      phoneNumber: emp.phoneNumber,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      photo: emp.photo,
      employeeType: emp.employeeType || "Permanent",
      inTime: emp.inTime || "",
      outTime: emp.outTime || "",
    });
    setErrors({});
    setDialogOpen(true);
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((p) => ({ ...p, photo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.code.trim()) e.code = "Code is required";
    if (!form.vendorId) e.vendorId = "Company is required";
    const isDuplicate = employees.some(
      (emp) => emp.code === form.code && emp.id !== editEmployee?.id,
    );
    if (isDuplicate) e.code = "Employee code already exists";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    if (editEmployee) {
      updateMutation.mutate({ ...editEmployee, ...form });
    } else {
      addMutation.mutate({
        id: crypto.randomUUID(),
        createdAt: BigInt(Date.now()),
        ...form,
      });
    }
  }

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <Card className="shadow-card border-border">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">
                All Employees
              </CardTitle>
              {!canEdit && (
                <Badge variant="secondary" className="text-xs">
                  Read Only
                </Badge>
              )}
            </div>
            {canEdit && (
              <Button
                data-ocid="employees.add.primary_button"
                size="sm"
                onClick={openAdd}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add Employee
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                data-ocid="employees.search.input"
                placeholder="Search by name or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Select value={filterVendor} onValueChange={setFilterVendor}>
              <SelectTrigger
                data-ocid="employees.vendor.select"
                className="w-44 h-9 text-sm"
              >
                <SelectValue placeholder="All Companies" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterShift} onValueChange={setFilterShift}>
              <SelectTrigger
                data-ocid="employees.shift.select"
                className="w-40 h-9 text-sm"
              >
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                {SHIFTS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SHIFT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="employees.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div
              data-ocid="employees.empty_state"
              className="py-16 text-center"
            >
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No employees found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="employees.table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">
                      Photo
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Code
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Company
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Department
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Designation
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Phone
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Joining Date
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp, idx) => (
                    <TableRow
                      key={emp.id}
                      data-ocid={`employees.item.${idx + 1}`}
                    >
                      <TableCell>
                        {emp.photo ? (
                          <img
                            src={emp.photo}
                            alt={emp.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </TableCell>
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
                        {emp.department || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {emp.designation || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {emp.phoneNumber || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${
                            emp.employeeType === "Casual"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {emp.employeeType || "Permanent"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {emp.joiningDate || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-primary"
                            onClick={() =>
                              navigate({ to: `/employees/${emp.id}` })
                            }
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                data-ocid={`employees.edit_button.${idx + 1}`}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => openEdit(emp)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                data-ocid={`employees.delete_button.${idx + 1}`}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(emp.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          data-ocid="employees.dialog"
          className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editEmployee ? "Edit Employee" : "Add Employee"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Photo upload */}
            <div className="space-y-1.5">
              <Label>Photo</Label>
              <div className="flex items-center gap-4">
                {form.photo ? (
                  <img
                    src={form.photo}
                    alt="preview"
                    className="h-14 w-14 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    No photo
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => photoInputRef.current?.click()}
                >
                  Upload Photo
                </Button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="emp-name">Full Name *</Label>
                <Input
                  id="emp-name"
                  data-ocid="employees.name.input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="e.g. John Smith"
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-code">Employee Code *</Label>
                <Input
                  id="emp-code"
                  data-ocid="employees.code.input"
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="e.g. EMP-001"
                />
                {errors.code && (
                  <p className="text-xs text-destructive">{errors.code}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Company *</Label>
                <Select
                  value={form.vendorId}
                  onValueChange={(v) => setForm((p) => ({ ...p, vendorId: v }))}
                >
                  <SelectTrigger data-ocid="employees.vendor_select.select">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.vendorId && (
                  <p className="text-xs text-destructive">{errors.vendorId}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Shift</Label>
                <Select
                  value={form.shift}
                  onValueChange={(v) => setForm((p) => ({ ...p, shift: v }))}
                >
                  <SelectTrigger data-ocid="employees.shift_select.select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SHIFT_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="emp-department">Department</Label>
                <Input
                  id="emp-department"
                  value={form.department}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, department: e.target.value }))
                  }
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-designation">Designation</Label>
                <Input
                  id="emp-designation"
                  value={form.designation}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, designation: e.target.value }))
                  }
                  placeholder="e.g. Senior Developer"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="emp-phone">Phone Number</Label>
                <Input
                  id="emp-phone"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phoneNumber: e.target.value }))
                  }
                  placeholder="e.g. 9876543210"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emp-parents">Parent's Name</Label>
                <Input
                  id="emp-parents"
                  value={form.parentsName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, parentsName: e.target.value }))
                  }
                  placeholder="e.g. Robert Smith"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="emp-joining">Joining Date</Label>
                <Input
                  id="emp-joining"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, joiningDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Employee Type</Label>
                <Select
                  value={form.employeeType}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, employeeType: v }))
                  }
                >
                  <SelectTrigger data-ocid="employees.employee_type.select">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="employees.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="employees.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editEmployee ? "Save Changes" : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="employees.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="employees.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="employees.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
