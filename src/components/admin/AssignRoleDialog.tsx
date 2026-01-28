import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Search, User, Loader2 } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  full_name: string;
  email: string;
  role: AdminRole | null;
}

interface AssignRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignRoleDialog({ open, onOpenChange }: AssignRoleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<AdminRole>('admin1');
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
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
          body: JSON.stringify({
            action: 'search_users',
            searchTerm,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      setUsers(result.users || []);
    } catch (error: any) {
      toast({
        title: 'Search failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const assignRole = useMutation({
    mutationFn: async () => {
      if (!selectedUser) throw new Error('No user selected');

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
          body: JSON.stringify({
            action: 'assign_role',
            userId: selectedUser.user_id,
            role: selectedRole,
          }),
        }
      );

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: 'Role assigned',
        description: `${selectedUser?.full_name} has been assigned the ${selectedRole.replace('_', ' ')} role.`,
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to assign role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setSearchTerm('');
    setUsers([]);
    setSelectedUser(null);
    setSelectedRole('admin1');
    onOpenChange(false);
  };

  const getRoleBadgeColor = (role: AdminRole | null) => {
    if (!role) return 'bg-muted text-muted-foreground';
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Role to Existing User</DialogTitle>
          <DialogDescription>
            Search for a registered user and assign them an admin role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
              />
            </div>
            <Button onClick={searchUsers} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* User List */}
          {users.length > 0 && (
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0 ${
                    selectedUser?.user_id === user.user_id ? 'bg-muted' : ''
                  }`}
                  onClick={() => !user.role && setSelectedUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  {user.role ? (
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                  ) : (
                    <Badge variant="outline">No role</Badge>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Selected User */}
          {selectedUser && (
            <div className="p-3 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">
                Assigning role to: <span className="text-secondary">{selectedUser.full_name}</span>
              </p>
              <div className="space-y-2">
                <Label>Select Role</Label>
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
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={() => assignRole.mutate()}
            disabled={!selectedUser || assignRole.isPending}
          >
            {assignRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
