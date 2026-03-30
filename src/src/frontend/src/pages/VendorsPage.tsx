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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Eye, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Vendor } from "../backend";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";

const SKELETON_KEYS = ["sk1", "sk2", "sk3", "sk4"];

const emptyForm = () => ({
  name: "",
  gstNumber: "",
  contactPersonName: "",
  contactNumber: "",
  address: "",
});

export default function VendorsPage() {
  const { actor, isFetching } = useActor();
  const { user } = useAppAuth();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [nameError, setNameError] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const navigate = useNavigate();
  const canEdit = user?.permissions === "edit";

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: () => actor!.getAllVendors(),
    enabled: !!actor && !isFetching,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => actor!.getAllEmployees(),
    enabled: !!actor && !isFetching,
  });

  function getEmployeeCount(vendorId: string) {
    return employees.filter((e) => e.vendorId === vendorId).length;
  }

  const addMutation = useMutation({
    mutationFn: (v: Vendor) => actor!.addVendor(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Company added");
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to add company"),
  });

  const updateMutation = useMutation({
    mutationFn: (v: Vendor) => actor!.updateVendor(v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Company updated");
      setDialogOpen(false);
    },
    onError: () => toast.error("Failed to update company"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => actor!.deleteVendor(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Company deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete company"),
  });

  function openAdd() {
    setEditVendor(null);
    setForm(emptyForm());
    setNameError("");
    setDialogOpen(true);
  }

  function openEdit(v: Vendor) {
    setEditVendor(v);
    setForm({
      name: v.name,
      gstNumber: v.gstNumber,
      contactPersonName: v.contactPersonName,
      contactNumber: v.contactNumber,
      address: v.address,
    });
    setNameError("");
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      setNameError("Company name is required");
      return;
    }
    setNameError("");
    const payload: Vendor = {
      id: editVendor ? editVendor.id : crypto.randomUUID(),
      name: form.name.trim(),
      gstNumber: form.gstNumber.trim(),
      contactPersonName: form.contactPersonName.trim(),
      contactNumber: form.contactNumber.trim(),
      address: form.address.trim(),
    };
    if (editVendor) {
      updateMutation.mutate(payload);
    } else {
      addMutation.mutate(payload);
    }
  }

  const isPending = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-5">
      <Card className="shadow-card border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base font-semibold">
                All Companies
              </CardTitle>
              {!canEdit && (
                <Badge variant="secondary" className="text-xs">
                  Read Only
                </Badge>
              )}
            </div>
            {canEdit && (
              <Button
                data-ocid="vendors.add.primary_button"
                size="sm"
                onClick={openAdd}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add Company
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="vendors.loading_state">
              {SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="h-10 w-full" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <div data-ocid="vendors.empty_state" className="py-16 text-center">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No companies yet.{canEdit ? " Add your first company." : ""}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto" data-ocid="vendors.table">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">
                      Company Name
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      GST Number
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Contact Person
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Contact Number
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Address
                    </TableHead>
                    <TableHead className="text-xs font-semibold">
                      Employees
                    </TableHead>
                    <TableHead className="text-xs font-semibold text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((v, idx) => (
                    <TableRow key={v.id} data-ocid={`vendors.item.${idx + 1}`}>
                      <TableCell className="font-medium text-sm">
                        {v.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {v.gstNumber || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.contactPersonName || "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {v.contactNumber || "-"}
                      </TableCell>
                      <TableCell className="text-sm max-w-[180px] truncate">
                        {v.address || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 text-sm">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                            {getEmployeeCount(v.id)}
                          </span>
                          employees
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-primary"
                            onClick={() => navigate({ to: `/vendors/${v.id}` })}
                            title="View Profile"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {canEdit && (
                            <>
                              <Button
                                data-ocid={`vendors.edit_button.${idx + 1}`}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => openEdit(v)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                data-ocid={`vendors.delete_button.${idx + 1}`}
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                onClick={() => setDeleteId(v.id)}
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
        <DialogContent data-ocid="vendors.dialog" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editVendor ? "Edit Company" : "Add Company"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-name">Company Name *</Label>
              <Input
                id="vendor-name"
                data-ocid="vendors.name.input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Acme Corp"
              />
              {nameError && (
                <p
                  data-ocid="vendors.name.error_state"
                  className="text-xs text-destructive"
                >
                  {nameError}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-gst">GST Number</Label>
              <Input
                id="vendor-gst"
                value={form.gstNumber}
                onChange={(e) =>
                  setForm({ ...form, gstNumber: e.target.value })
                }
                placeholder="e.g. 22AAAAA0000A1Z5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-contact-person">Contact Person Name</Label>
              <Input
                id="vendor-contact-person"
                value={form.contactPersonName}
                onChange={(e) =>
                  setForm({ ...form, contactPersonName: e.target.value })
                }
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-contact-number">Contact Number</Label>
              <Input
                id="vendor-contact-number"
                value={form.contactNumber}
                onChange={(e) =>
                  setForm({ ...form, contactNumber: e.target.value })
                }
                placeholder="e.g. 9876543210"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-address">Address</Label>
              <Textarea
                id="vendor-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Enter company address"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="vendors.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="vendors.submit_button"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editVendor ? "Save Changes" : "Add Company"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="vendors.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the company. Employees assigned to this company
              will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="vendors.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="vendors.delete.confirm_button"
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
