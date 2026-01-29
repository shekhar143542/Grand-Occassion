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
import { VenueManagement } from '@/components/admin/VenueManagement';
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
  Building2,
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />

      <div className="pt-24 pb-16 container mx-auto px-4">
        {/* Header with Premium Styling */}
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent rounded-lg blur-3xl -z-10" />
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/20">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <Badge variant="outline" className="text-sm px-4 py-1 border-primary/30 bg-primary/5 text-primary font-medium">
                  {userRole?.replace('_', ' ').toUpperCase()}
                </Badge>
                <p className="text-muted-foreground text-sm">
                  {userRole && roleDescriptions[userRole]}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl transition-all group-hover:scale-105" />
            <div className="relative luxury-card p-6 border-amber-500/20 hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-500/10 rounded-xl">
                  <FileCheck className="h-6 w-6 text-amber-500" />
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/10 blur-xl" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl transition-all group-hover:scale-105" />
            <div className="relative luxury-card p-6 border-green-500/20 hover:border-green-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 blur-xl" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Approved</p>
                <p className="text-3xl font-bold text-foreground">{stats.approved}</p>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-500/5 rounded-xl transition-all group-hover:scale-105" />
            <div className="relative luxury-card p-6 border-red-500/20 hover:border-red-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl">
                  <UserCheck className="h-6 w-6 text-red-500" />
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/10 blur-xl" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Rejected</p>
                <p className="text-3xl font-bold text-foreground">{stats.rejected}</p>
              </div>
            </div>
          </div>
          
          <div className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl transition-all group-hover:scale-105" />
            <div className="relative luxury-card p-6 border-primary/20 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 blur-xl" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs with Premium Styling */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-border/50 flex-wrap h-auto gap-2 p-2 rounded-xl shadow-lg">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Pending ({getRelevantBookings('pending').length})
            </TabsTrigger>
            <TabsTrigger 
              value="approved" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approved
            </TabsTrigger>
            <TabsTrigger 
              value="rejected" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Rejected/Changes
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all"
            >
              <LayoutDashboard className="h-4 w-4 mr-2" />
              All Bookings
            </TabsTrigger>
            {userRole === 'super_admin' && (
              <>
                <TabsTrigger 
                  value="venues" 
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Venue Management
                </TabsTrigger>
                <TabsTrigger 
                  value="admins" 
                  className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-lg transition-all"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Admin Management
                </TabsTrigger>
              </>
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
                <div className="luxury-card p-16 text-center border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                  <div className="inline-flex p-6 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl mb-6">
                    <FileCheck className="h-20 w-20 text-primary/50" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold mb-3 text-foreground">
                    No bookings in this category
                  </h3>
                  <p className="text-muted-foreground text-lg">
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
            <>
              <TabsContent value="venues">
                <VenueManagement />
              </TabsContent>
              <TabsContent value="admins">
                <AdminManagement />
              </TabsContent>
            </>
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
