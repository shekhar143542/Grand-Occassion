import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminRole, Profile } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AssignRoleDialog } from './AssignRoleDialog';
import { UserPlus, Shield, Trash2, Loader2, UserCog, RefreshCw } from 'lucide-react';

interface AdminWithProfile {
  id: string;
  user_id: string;
  role: AdminRole;
  created_at: string;
  profile?: Profile;
}

export function AdminManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('admin1');
  
  // Edit states
  const [editingAdmin, setEditingAdmin] = useState<AdminWithProfile | null>(null);
  const [newRole, setNewRole] = useState<AdminRole>('admin1');
  
  // Delete state
  const [deletingAdmin, setDeletingAdmin] = useState<AdminWithProfile | null>(null);

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const adminsWithProfiles: AdminWithProfile[] = [];
      for (const role of roles || []) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', role.user_id)
          .maybeSingle();

        adminsWithProfiles.push({
          ...role,
          profile: profile as Profile | undefined,
        });
      }

      return adminsWithProfiles;
    },
  });

  const callAdminFunction = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-admin`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Operation failed');
    return result;
  };

  const createAdmin = useMutation({
    mutationFn: () => callAdminFunction({
      action: 'create',
      email,
      password,
      fullName,
      role: selectedRole,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Admin created',
        description: `${fullName} has been added as ${selectedRole.replace('_', ' ')}.`,
      });
      resetCreateForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create admin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateRole = useMutation({
    mutationFn: () => {
      if (!editingAdmin) throw new Error('No admin selected');
      return callAdminFunction({
        action: 'update_role',
        userId: editingAdmin.user_id,
        role: newRole,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role updated',
        description: `Role has been updated to ${newRole.replace('_', ' ')}.`,
      });
      setEditDialogOpen(false);
      setEditingAdmin(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const removeRole = useMutation({
    mutationFn: () => {
      if (!deletingAdmin) throw new Error('No admin selected');
      return callAdminFunction({
        action: 'remove_role',
        userId: deletingAdmin.user_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Admin removed',
        description: 'The admin role has been removed.',
      });
      setDeleteDialogOpen(false);
      setDeletingAdmin(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove admin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetCreateForm = () => {
    setCreateDialogOpen(false);
    setEmail('');
    setPassword('');
    setFullName('');
    setSelectedRole('admin1');
  };

  const handleEditClick = (admin: AdminWithProfile) => {
    setEditingAdmin(admin);
    setNewRole(admin.role);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (admin: AdminWithProfile) => {
    setDeletingAdmin(admin);
    setDeleteDialogOpen(true);
  };

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'admin1':
        return 'bg-blue-500/20 text-blue-500 border-blue-500/30';
      case 'admin2':
        return 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30';
      case 'admin3':
        return 'bg-purple-500/20 text-purple-500 border-purple-500/30';
      case 'super_admin':
        return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
    }
  };

  const getRoleLabel = (role: AdminRole) => {
    switch (role) {
      case 'admin1':
        return 'Admin1 - Document Verification';
      case 'admin2':
        return 'Admin2 - Availability & Payment';
      case 'admin3':
        return 'Admin3 - Final Approval';
      case 'super_admin':
        return 'SuperAdmin';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold">Admin Management</h2>
          <p className="text-muted-foreground">Create and manage admin accounts</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAssignDialogOpen(true)}>
            <UserCog className="h-4 w-4 mr-2" />
            Assign Role
          </Button>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Admin
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Create a new admin account with email and password.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AdminRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin1">Admin1 - Document Verification</SelectItem>
                      <SelectItem value="admin2">Admin2 - Availability & Payment</SelectItem>
                      <SelectItem value="admin3">Admin3 - Final Approval</SelectItem>
                      <SelectItem value="super_admin">SuperAdmin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetCreateForm}>
                  Cancel
                </Button>
                <Button
                  onClick={() => createAdmin.mutate()}
                  disabled={!email || !password || !fullName || createAdmin.isPending}
                >
                  {createAdmin.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Admin
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Admin List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : admins?.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Shield className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No admin users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins?.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{admin.profile?.full_name || 'Unknown'}</p>
                  <p className="text-sm text-muted-foreground">{admin.profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Badge className={getRoleBadgeColor(admin.role)}>
                  {getRoleLabel(admin.role)}
                </Badge>
                {admin.user_id !== user?.id && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(admin)}
                      title="Change role"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteClick(admin)}
                      title="Remove admin"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Role Dialog */}
      <AssignRoleDialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen} />

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Admin Role</DialogTitle>
            <DialogDescription>
              Update the role for {editingAdmin?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label>New Role</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin1">Admin1 - Document Verification</SelectItem>
                <SelectItem value="admin2">Admin2 - Availability & Payment</SelectItem>
                <SelectItem value="admin3">Admin3 - Final Approval</SelectItem>
                <SelectItem value="super_admin">SuperAdmin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => updateRole.mutate()} disabled={updateRole.isPending}>
              {updateRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Admin Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove admin access for{' '}
              <span className="font-medium">{deletingAdmin?.profile?.full_name}</span>?
              They will no longer be able to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeRole.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Remove Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
