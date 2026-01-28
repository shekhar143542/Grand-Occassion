import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BanquetHall, BookingStatus, roleDescriptions } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookingCard } from '@/components/admin/BookingCard';
import { BookingDetailsDialog } from '@/components/admin/BookingDetailsDialog';
import { ActionDialog, ActionType } from '@/components/admin/ActionDialog';
import { AdminManagement } from '@/components/admin/AdminManagement';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  FileCheck,
  UserCheck,
  CheckCircle,
  Users,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, userRole, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<ActionType>('approve');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, loading, navigate]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', userRole],
    queryFn: async () => {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch halls and documents for each booking
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          // Fetch halls
          const { data: bookingHalls } = await supabase
            .from('booking_halls')
            .select('hall_id')
            .eq('booking_id', booking.id);

          let halls: BanquetHall[] = [];
          if (bookingHalls && bookingHalls.length > 0) {
            const hallIds = bookingHalls.map(bh => bh.hall_id);
            const { data: hallsData } = await supabase
              .from('banquet_halls')
              .select('*')
              .in('id', hallIds);
            halls = (hallsData as BanquetHall[]) || [];
          }

          // Fetch documents
          const { data: docs } = await supabase
            .from('booking_documents')
            .select('*')
            .eq('booking_id', booking.id);

          return { ...booking, halls, documents: docs || [] };
        })
      );

      return bookingsWithDetails as Booking[];
    },
    enabled: !!user && isAdmin,
  });

  const updateBooking = useMutation({
    mutationFn: async ({
      bookingId,
      status,
      notes,
      advanceAmount,
    }: {
      bookingId: string;
      status: BookingStatus;
      notes: string;
      advanceAmount?: number;
    }) => {
      const updateData: Record<string, any> = { status };

      // Set role-specific notes
      if (userRole === 'admin1') {
        updateData.admin1_notes = notes;
      } else if (userRole === 'admin2') {
        updateData.admin2_notes = notes;
        if (advanceAmount) {
          updateData.advance_amount = advanceAmount;
        }
      } else if (userRole === 'admin3' || userRole === 'super_admin') {
        updateData.super_admin_notes = notes;
      }

      // Generate confirmation number for approved bookings
      if (status === 'approved') {
        updateData.confirmation_number = `BK${Date.now().toString(36).toUpperCase()}`;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // Create audit log
      const previousStatus = selectedBooking?.status;
      await supabase.from('audit_logs').insert({
        booking_id: bookingId,
        action: getActionLabel(status, previousStatus),
        previous_status: previousStatus,
        new_status: status,
        performed_by: user?.id,
        performed_by_role: userRole,
        reason: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({
        title: 'Booking updated',
        description: 'The booking status has been updated successfully.',
      });
      setActionDialogOpen(false);
      setSelectedBooking(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getActionLabel = (newStatus: BookingStatus, prevStatus?: BookingStatus) => {
    switch (newStatus) {
      case 'document_review':
        return 'Documents Approved - Forwarded to Admin2';
      case 'change_requested':
        return 'Changes Requested';
      case 'rejected':
        return 'Booking Rejected';
      case 'payment_pending':
        return 'Payment Requested';
      case 'final_approval':
        return 'Forwarded to Admin3 for Final Approval';
      case 'approved':
        return 'Booking Approved';
      default:
        return 'Status Updated';
    }
  };

  const handleAction = (booking: Booking, action: ActionType) => {
    setSelectedBooking(booking);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const confirmAction = (notes: string, advanceAmount?: number) => {
    if (!selectedBooking) return;

    let newStatus: BookingStatus;

    switch (actionType) {
      case 'approve':
        if (userRole === 'admin1') {
          newStatus = 'document_review';
        } else if (userRole === 'admin3' || userRole === 'super_admin') {
          newStatus = 'approved';
        } else {
          newStatus = selectedBooking.status;
        }
        break;
      case 'reject':
        newStatus = 'rejected';
        break;
      case 'request_changes':
        newStatus = 'change_requested';
        break;
      case 'request_payment':
        newStatus = 'payment_pending';
        break;
      case 'forward_admin3':
        newStatus = 'final_approval';
        break;
      default:
        newStatus = selectedBooking.status;
    }

    updateBooking.mutate({
      bookingId: selectedBooking.id,
      status: newStatus,
      notes,
      advanceAmount,
    });
  };

  const getRelevantBookings = (tab: string) => {
    if (!bookings) return [];

    switch (tab) {
      case 'pending':
        // Admin1 sees pending docs verification
        if (userRole === 'admin1') {
          return bookings.filter(b => b.status === 'pending');
        }
        // Admin2 sees pending availability/payment
        if (userRole === 'admin2') {
          return bookings.filter(b => 
            b.status === 'document_review' || b.status === 'payment_pending'
          );
        }
        // Admin3 sees pending final approval
        if (userRole === 'admin3') {
          return bookings.filter(b => b.status === 'final_approval');
        }
        // SuperAdmin sees all pending at any stage
        if (userRole === 'super_admin') {
          return bookings.filter(b => 
            b.status !== 'approved' && b.status !== 'rejected'
          );
        }
        return [];

      case 'approved':
        return bookings.filter(b => b.status === 'approved');

      case 'rejected':
        return bookings.filter(b => 
          b.status === 'rejected' || b.status === 'change_requested'
        );

      case 'all':
        return bookings;

      default:
        return [];
    }
  };

  const getStats = () => {
    if (!bookings) return { pending: 0, approved: 0, rejected: 0, total: 0 };

    return {
      pending: bookings.filter(b => 
        b.status !== 'approved' && b.status !== 'rejected'
      ).length,
      approved: bookings.filter(b => b.status === 'approved').length,
      rejected: bookings.filter(b => b.status === 'rejected').length,
      total: bookings.length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-secondary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-secondary" />
            <h1 className="font-serif text-4xl font-bold text-foreground">
              Admin Dashboard
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {userRole?.replace('_', ' ').toUpperCase()}
            </Badge>
            <p className="text-muted-foreground">
              {userRole && roleDescriptions[userRole]}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="luxury-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <FileCheck className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="luxury-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="luxury-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <UserCheck className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </div>
          <div className="luxury-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-muted/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="pending" className="data-[state=active]:bg-card">
              <FileCheck className="h-4 w-4 mr-2" />
              Pending ({getRelevantBookings('pending').length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-card">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-card">
              <UserCheck className="h-4 w-4 mr-2" />
              Rejected/Changes
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-card">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              All Bookings
            </TabsTrigger>
            {userRole === 'super_admin' && (
              <TabsTrigger value="admins" className="data-[state=active]:bg-card">
                <Users className="h-4 w-4 mr-2" />
                Admin Management
              </TabsTrigger>
            )}
          </TabsList>

          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="luxury-card p-6">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : getRelevantBookings(tab).length === 0 ? (
                <div className="luxury-card p-12 text-center">
                  <FileCheck className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    No bookings in this category
                  </h3>
                  <p className="text-muted-foreground">
                    Bookings requiring your attention will appear here.
                  </p>
                </div>
              ) : (
                getRelevantBookings(tab).map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    userRole={userRole}
                    onViewDetails={(b) => {
                      setSelectedBooking(b);
                      setDetailsOpen(true);
                    }}
                    onApprove={(b) => handleAction(b, 'approve')}
                    onReject={(b) => handleAction(b, 'reject')}
                    onRequestChanges={(b) => handleAction(b, 'request_changes')}
                    onRequestPayment={(b) => handleAction(b, 'request_payment')}
                    onForwardToAdmin3={(b) => handleAction(b, 'forward_admin3')}
                  />
                ))
              )}
            </TabsContent>
          ))}

          {userRole === 'super_admin' && (
            <TabsContent value="admins">
              <AdminManagement />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <BookingDetailsDialog
        booking={selectedBooking}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <ActionDialog
        booking={selectedBooking}
        open={actionDialogOpen}
        onOpenChange={setActionDialogOpen}
        actionType={actionType}
        userRole={userRole}
        onConfirm={confirmAction}
        isLoading={updateBooking.isPending}
      />
    </div>
  );
}
