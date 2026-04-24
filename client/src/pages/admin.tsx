import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Users,
  FolderKanban,
  DollarSign,
  Activity,
  Search,
  Pencil,
  Trash2,
  X,
  Check,
  ShieldAlert,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ALL_ROLES = ["applicant", "reviewer", "investor", "admin"] as const;

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "admin":
      return "bg-red-100 text-red-800 border-red-200";
    case "reviewer":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "investor":
      return "bg-green-100 text-green-800 border-green-200";
    case "applicant":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}

export default function Admin() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingRoles, setEditingRoles] = useState<string[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const updateRolesMutation = useMutation({
    mutationFn: async ({ userId, roles }: { userId: number; roles: string[] }) => {
      return await apiRequest("PATCH", `/api/admin/users/${userId}/roles`, { roles });
    },
    onSuccess: () => {
      toast({ title: "Roles updated", description: "User roles have been updated successfully." });
      setEditingUserId(null);
      setEditingRoles([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update user roles.", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "User deleted", description: "The user has been removed from the platform." });
      setDeleteUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    },
  });

  const filteredUsers = (users as any[]).filter((user: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    const email = (user.email || "").toLowerCase();
    const org = (user.organization || "").toLowerCase();
    return fullName.includes(term) || email.includes(term) || org.includes(term);
  });

  const startEditing = (user: any) => {
    setEditingUserId(user.id);
    setEditingRoles([...(user.roles || [])]);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
    setEditingRoles([]);
  };

  const toggleRole = (role: string) => {
    setEditingRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const saveRoles = () => {
    if (editingUserId === null) return;
    if (editingRoles.length === 0) {
      toast({
        title: "Invalid",
        description: "A user must have at least one role.",
        variant: "destructive",
      });
      return;
    }
    updateRolesMutation.mutate({ userId: editingUserId, roles: editingRoles });
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? "--",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Projects",
      value: stats?.totalProjects ?? "--",
      icon: FolderKanban,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Total Invested",
      value: stats?.totalInvested != null ? `$${Number(stats.totalInvested).toLocaleString()}` : "--",
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects ?? "--",
      icon: Activity,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  const userToDelete = deleteUserId != null
    ? (users as any[]).find((u: any) => u.id === deleteUserId)
    : null;

  return (
    <div className="min-h-screen bg-neutral-50">
      <AppHeader currentRole="admin" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          </div>
          <p className="text-neutral-600">Manage users, view platform statistics, and oversee operations.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-neutral-900 mt-1">
                      {statsLoading ? (
                        <span className="inline-block h-7 w-16 bg-neutral-200 rounded animate-pulse" />
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl">User Management</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-neutral-100 rounded animate-pulse" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-600">
                  {searchTerm ? "No users match your search." : "No users found."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: any) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell className="text-neutral-600">{user.email}</TableCell>
                        <TableCell>
                          {editingUserId === user.id ? (
                            <div className="flex flex-wrap gap-2">
                              {ALL_ROLES.map((role) => (
                                <label
                                  key={role}
                                  className="flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={editingRoles.includes(role)}
                                    onCheckedChange={() => toggleRole(role)}
                                  />
                                  <span className="text-sm capitalize">{role}</span>
                                </label>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(user.roles || []).map((role: string) => (
                                <Badge
                                  key={role}
                                  variant="outline"
                                  className={`capitalize ${getRoleBadgeColor(role)}`}
                                >
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-neutral-600">
                          {user.organization || "--"}
                        </TableCell>
                        <TableCell className="text-neutral-600">
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : "--"}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingUserId === user.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={saveRoles}
                                disabled={updateRolesMutation.isPending}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEditing}
                                disabled={updateRolesMutation.isPending}
                              >
                                <X className="h-4 w-4 text-neutral-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditing(user)}
                                title="Edit roles"
                              >
                                <Pencil className="h-4 w-4 text-neutral-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteUserId(user.id)}
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteUserId !== null} onOpenChange={(open) => !open && setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium text-neutral-900">
                {userToDelete ? `${userToDelete.firstName} ${userToDelete.lastName}` : "this user"}
              </span>
              ? This action cannot be undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteUserId !== null && deleteUserMutation.mutate(deleteUserId)}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
