import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeft, Building2 } from "lucide-react";
import { useActor } from "../hooks/useActor";

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 py-2">
      <span className="text-sm text-muted-foreground w-44 shrink-0">
        {label}
      </span>
      <span className="text-sm font-medium">{value || "—"}</span>
    </div>
  );
}

export default function CompanyProfilePage() {
  const { id } = useParams({ from: "/vendors/$id" });
  const navigate = useNavigate();
  const { actor, isFetching } = useActor();

  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const v = await actor!.getVendor(id);
      return v;
    },
    enabled: !!actor && !isFetching,
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => actor!.getAllEmployees(),
    enabled: !!actor && !isFetching,
  });

  const companyEmployees = employees.filter((e) => e.vendorId === id);

  if (vendorLoading) {
    return (
      <div className="space-y-4 max-w-2xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Company not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ to: "/vendors" })}
        >
          Back to Companies
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
          onClick={() => navigate({ to: "/vendors" })}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h1 className="text-lg font-semibold">Company Profile</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="h-20 w-20 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-9 w-9 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{vendor.name}</h2>
              {vendor.gstNumber && (
                <p className="text-muted-foreground text-sm mt-0.5">
                  GST: {vendor.gstNumber}
                </p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">
                  {companyEmployees.length}{" "}
                  {companyEmployees.length === 1 ? "Employee" : "Employees"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow label="Company Name" value={vendor.name} />
          <Separator />
          <InfoRow label="GST Number" value={vendor.gstNumber} />
          <Separator />
          <InfoRow label="Contact Person" value={vendor.contactPersonName} />
          <Separator />
          <InfoRow label="Contact Number" value={vendor.contactNumber} />
          <Separator />
          <InfoRow label="Address" value={vendor.address} />
        </CardContent>
      </Card>

      {companyEmployees.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Employees ({companyEmployees.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Code</TableHead>
                  <TableHead className="text-xs font-semibold">
                    Department
                  </TableHead>
                  <TableHead className="text-xs font-semibold">
                    Designation
                  </TableHead>
                  <TableHead className="text-xs font-semibold">Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyEmployees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="text-sm font-medium">
                      {emp.name}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {emp.code}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
