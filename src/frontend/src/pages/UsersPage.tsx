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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  ShieldAlert,
  Trash2,
  UserCog,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppUser } from "../backend";
import { useActor } from "../hooks/useActor";
import { useAppAuth } from "../hooks/useAppAuth";

const SKELETON_KEYS = ["sk1", "sk2", "sk3"];

function emptyUserForm() {
  return { username: "", password: "", role: "user", permissions: "view" };
}

export default function UsersPage() {
  const { user: me, login } = useAppAuth();
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  // User CRUD dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [userForm, setUserForm] = useState(emptyUserForm());
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>(
    {},
  );

  // Change password dialog (admin changing another user's password)
  const [changePwdDialogOpen, setChangePwdDialogOpen] = useState(false);
  const [changePwdTarget, setChangePwdTarget] = useState<AppUser | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // My password change
  const [myOldPwd, setMyOldPwd] = useState("");
  const [myNewPwd, setMyNewPwd] = useState("");
  const [myConfirmPwd, setMyConfirmPwd] = useState("");
  const [myPwdError, setMyPwdError] = useState("");
  const [myPwdLoading, setMyPwdLoading] = useState(false);

  const isAdmin = me?.role === "admin";

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["appUsers"],
    queryFn: () => actor!.getAllAppUsers(me!.username, me!.password),
    enabled: !!actor && !isFetching && isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (newUser: AppUser) =>
      actor!.createAppUser(me!.username, me!.password, newUser),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appUsers"] });
      toast.success("User created");
      setUserDialogOpen(false);
    },
    onError: () => toast.error("Failed to create user"),
  });

  const updateMutation = useMutation({
    mutationFn: (u: AppUser) =>
      actor!.updateAppUser(me!.username, me!.password, u),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appUsers"] });
      toast.success("User updated");
      setUserDialogOpen(false);
    },
    onError: () => toast.error("Failed to update user"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      actor!.deleteAppUser(me!.username, me!.password, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appUsers"] });
      toast.success("User deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete user"),
  });

  function openAdd() {
    setEditUser(null);
    setUserForm(emptyUserForm());
    setUserFormErrors({});
    setUserDialogOpen(true);
  }

  function openEdit(u: AppUser) {
    setEditUser(u);
    setUserForm({
      username: u.username,
      password: u.password,
      role: u.role,
      permissions: u.permissions,
    });
    setUserFormErrors({});
    setUserDialogOpen(true);
  }

  function validateUserForm() {
    const e: Record<string, string> = {};
    if (!userForm.username.trim()) e.username = "Username is required";
    if (!editUser && !userForm.password.trim())
      e.password = "Password is required";
    setUserFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleUserSubmit() {
    if (!validateUserForm()) return;
    if (editUser) {
      updateMutation.mutate({
        ...editUser,
        username: userForm.username,
        role: userForm.role,
        permissions: userForm.permissions,
      });
    } else {
      createMutation.mutate({
        id: crypto.randomUUID(),
        username: userForm.username,
        password: userForm.password,
        role: userForm.role,
        permissions: userForm.permissions,
      });
    }
  }

  function openChangePwd(u: AppUser) {
    setChangePwdTarget(u);
    setNewPwd("");
    setConfirmPwd("");
    setPwdError("");
    setChangePwdDialogOpen(true);
  }

  async function handleChangePwd() {
    if (!newPwd.trim()) {
      setPwdError("New password is required");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match");
      return;
    }
    if (!actor || !changePwdTarget) return;
    setPwdError("");
    try {
      // Admin sets a new password by using a special flow: update user object
      await actor.updateAppUser(me!.username, me!.password, {
        ...changePwdTarget,
        password: newPwd,
      });
      qc.invalidateQueries({ queryKey: ["appUsers"] });
      toast.success("Password changed");
      setChangePwdDialogOpen(false);
    } catch {
      setPwdError("Failed to change password");
    }
  }

  async function handleMyPasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!myOldPwd.trim() || !myNewPwd.trim()) {
      setMyPwdError("All fields are required");
      return;
    }
    if (myNewPwd !== myConfirmPwd) {
      setMyPwdError("New passwords do not match");
      return;
    }
    if (!actor || !me) return;
    setMyPwdLoading(true);
    setMyPwdError("");
    try {
      const result = await actor.changeAppPassword(
        me.username,
        myOldPwd,
        myNewPwd,
      );
      if (
        result.includes("success") ||
        result.includes("changed") ||
        result === "ok"
      ) {
        // Update session with new password
        login({ ...me, password: myNewPwd });
        toast.success("Password updated successfully");
        setMyOldPwd("");
        setMyNewPwd("");
        setMyConfirmPwd("");
      } else {
        setMyPwdError(result || "Failed to change password");
      }
    } catch {
      setMyPwdError("Failed to change password");
    } finally {
      setMyPwdLoading(false);
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Admin: User Management Table */}
      {isAdmin ? (
        <Card className="shadow-card border-border">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                <CardTitle className="text-base font-semibold">
                  User Management
                </CardTitle>
              </div>
              <Button
                data-ocid="users.add.primary_button"
                size="sm"
                onClick={openAdd}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3" data-ocid="users.loading_state">
                {SKELETON_KEYS.map((k) => (
                  <Skeleton key={k} className="h-10 w-full" />
                ))}
              </div>
            ) : users.length === 0 ? (
              <div data-ocid="users.empty_state" className="py-16 text-center">
                <UserCog className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No users found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto" data-ocid="users.table">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold">
                        Username
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Role
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Permissions
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u, idx) => (
                      <TableRow key={u.id} data-ocid={`users.item.${idx + 1}`}>
                        <TableCell className="font-medium text-sm">
                          {u.username}
                          {u.id === me?.id && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] px-1.5 py-0 h-4"
                            >
                              You
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="text-xs"
                            style={{
                              background:
                                u.role === "admin"
                                  ? "oklch(0.55 0.22 264 / 0.15)"
                                  : "oklch(0.72 0.19 142 / 0.12)",
                              color:
                                u.role === "admin"
                                  ? "oklch(0.55 0.22 264)"
                                  : "oklch(0.5 0.15 142)",
                              border: "none",
                            }}
                          >
                            {u.role === "admin" ? "Admin" : "User"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="text-xs"
                            style={{
                              background:
                                u.permissions === "edit"
                                  ? "oklch(0.65 0.2 50 / 0.12)"
                                  : "oklch(0.6 0.03 255 / 0.15)",
                              color:
                                u.permissions === "edit"
                                  ? "oklch(0.55 0.2 50)"
                                  : "oklch(0.5 0.05 255)",
                              border: "none",
                            }}
                          >
                            {u.permissions === "edit" ? "Edit" : "View Only"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              data-ocid={`users.edit_button.${idx + 1}`}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEdit(u)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              data-ocid={`users.change_password.button.${idx + 1}`}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Change Password"
                              onClick={() => openChangePwd(u)}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              data-ocid={`users.delete_button.${idx + 1}`}
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                              disabled={u.id === "user-admin"}
                              onClick={() => setDeleteId(u.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
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
      ) : (
        <Card className="shadow-card border-border">
          <CardContent
            className="py-12 text-center"
            data-ocid="users.access.error_state"
          >
            <ShieldAlert className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              Access Denied
            </p>
            <p className="text-xs text-muted-foreground">
              Only administrators can manage users.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Change My Password — all users */}
      <Card className="shadow-card border-border max-w-md">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">
              Change My Password
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleMyPasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="my-old-pwd">Current Password</Label>
              <Input
                id="my-old-pwd"
                data-ocid="users.my_old_password.input"
                type="password"
                value={myOldPwd}
                onChange={(e) => setMyOldPwd(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="my-new-pwd">New Password</Label>
              <Input
                id="my-new-pwd"
                data-ocid="users.my_new_password.input"
                type="password"
                value={myNewPwd}
                onChange={(e) => setMyNewPwd(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="my-confirm-pwd">Confirm New Password</Label>
              <Input
                id="my-confirm-pwd"
                data-ocid="users.my_confirm_password.input"
                type="password"
                value={myConfirmPwd}
                onChange={(e) => setMyConfirmPwd(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {myPwdError && (
              <p
                data-ocid="users.my_password.error_state"
                className="text-xs text-destructive"
              >
                {myPwdError}
              </p>
            )}
            <Button
              data-ocid="users.my_password.submit_button"
              type="submit"
              disabled={myPwdLoading}
              className="w-full"
            >
              {myPwdLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Add/Edit User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent data-ocid="users.dialog" className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editUser ? "Edit User" : "Add User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-username">Username (User ID)</Label>
              <Input
                id="user-username"
                data-ocid="users.username.input"
                value={userForm.username}
                onChange={(e) =>
                  setUserForm((p) => ({ ...p, username: e.target.value }))
                }
                placeholder="e.g. john.doe"
              />
              {userFormErrors.username && (
                <p
                  data-ocid="users.username.error_state"
                  className="text-xs text-destructive"
                >
                  {userFormErrors.username}
                </p>
              )}
            </div>
            {!editUser && (
              <div className="space-y-1.5">
                <Label htmlFor="user-password">Password</Label>
                <Input
                  id="user-password"
                  data-ocid="users.password.input"
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="Set initial password"
                />
                {userFormErrors.password && (
                  <p
                    data-ocid="users.password.error_state"
                    className="text-xs text-destructive"
                  >
                    {userFormErrors.password}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(v) => setUserForm((p) => ({ ...p, role: v }))}
              >
                <SelectTrigger data-ocid="users.role.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Permissions</Label>
              <Select
                value={userForm.permissions}
                onValueChange={(v) =>
                  setUserForm((p) => ({ ...p, permissions: v }))
                }
              >
                <SelectTrigger data-ocid="users.permissions.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Edit (Full Access)</SelectItem>
                  <SelectItem value="view">View Only (Read-Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUserDialogOpen(false)}
              data-ocid="users.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.submit_button"
              onClick={handleUserSubmit}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editUser ? "Save Changes" : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog (admin) */}
      <Dialog open={changePwdDialogOpen} onOpenChange={setChangePwdDialogOpen}>
        <DialogContent
          data-ocid="users.change_password.dialog"
          className="sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>
              Change Password — {changePwdTarget?.username}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-pwd">New Password</Label>
              <Input
                id="new-pwd"
                data-ocid="users.new_password.input"
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pwd">Confirm Password</Label>
              <Input
                id="confirm-pwd"
                data-ocid="users.confirm_password.input"
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {pwdError && (
              <p
                data-ocid="users.change_password.error_state"
                className="text-xs text-destructive"
              >
                {pwdError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangePwdDialogOpen(false)}
              data-ocid="users.change_password.cancel_button"
            >
              Cancel
            </Button>
            <Button
              data-ocid="users.change_password.confirm_button"
              onClick={handleChangePwd}
            >
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="users.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="users.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="users.delete.confirm_button"
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
