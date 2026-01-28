import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BanquetHall, AdminRole, statusLabels, statusColors, BookingStatus } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare,
  DollarSign,
  Shield,
  UserCheck,
  FileCheck,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, userRole, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'request_changes' | 'request_payment'>('approve');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (!user || !isAdmin) {
      navigate('/');
    }
  }, [user, isAdmin, navigate]);

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['admin-bookings', userRole],
    queryFn: async () => {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch halls for each booking
      const bookingsWithHalls = await Promise.all(
        (bookingsData || []).map(async (booking) => {
          const { data: bookingHalls } = await supabase
            .from('booking_halls')
            .select('hall_id')
            .eq('booking_id', booking.id);

          if (bookingHalls && bookingHalls.length > 0) {
            const hallIds = bookingHalls.map(bh => bh.hall_id);
            const { data: halls } = await supabase
              .from('banquet_halls')
              .select('*')
              .in('id', hallIds);

            return { ...booking, halls: halls as BanquetHall[] };
          }

          return { ...booking, halls: [] };
        })
      );

      return bookingsWithHalls as Booking[];
    },
    enabled: !!user && isAdmin,
  });

  const updateBooking = useMutation({
    mutationFn: async ({
      bookingId,
      status,
      notes,
    }: {
      bookingId: string;
      status: BookingStatus;
      notes: string;
    }) => {
      const updateData: Record<string, string> = { status };

      if (userRole === 'admin1') {
        updateData.admin1_notes = notes;
      } else if (userRole === 'admin2') {
        updateData.admin2_notes = notes;
      } else if (userRole === 'super_admin') {
        updateData.super_admin_notes = notes;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      toast({
        title: 'Booking updated',
        description: 'The booking status has been updated successfully.',
      });
      setActionDialogOpen(false);
      setAdminNotes('');
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

  const handleAction = (booking: Booking, action: typeof actionType) => {
    setSelectedBooking(booking);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const confirmAction = () => {
    if (!selectedBooking) return;

    let newStatus: BookingStatus;
    
    switch (actionType) {
      case 'approve':
        if (userRole === 'admin1') {
          newStatus = 'availability_check';
        } else if (userRole === 'admin2') {
          newStatus = 'final_approval';
        } else {
          newStatus = 'approved';
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
      default:
        newStatus = selectedBooking.status;
    }

    updateBooking.mutate({
      bookingId: selectedBooking.id,
      status: newStatus,
      notes: adminNotes,
    });
  };

  const getRelevantBookings = (status: string) => {
    if (!bookings) return [];
    
    switch (status) {
      case 'pending':
        if (userRole === 'admin1') {
          return bookings.filter(b => b.status === 'pending' || b.status === 'document_review');
        }
        return [];
      case 'review':
        if (userRole === 'admin2') {
          return bookings.filter(b => b.status === 'availability_check' || b.status === 'payment_pending');
        }
        if (userRole === 'super_admin') {
          return bookings.filter(b => b.status === 'final_approval');
        }
        return [];
      case 'completed':
        return bookings.filter(b => b.status === 'approved' || b.status === 'rejected');
      default:
        return bookings;
    }
  };

  const getRoleDescription = () => {
    switch (userRole) {
      case 'admin1':
        return 'Document Verification - Review booking documents and initial requests';
      case 'admin2':
        return 'Availability Check - Verify venue availability and manage payments';
      case 'super_admin':
        return 'Final Approval - Complete booking approvals and manage admins';
      default:
        return '';
    }
  };

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
          <p className="text-muted-foreground flex items-center gap-2">
            <Badge variant="secondary">{userRole?.replace('_', ' ').toUpperCase()}</Badge>
            {getRoleDescription()}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="pending" className="data-[state=active]:bg-card">
              <FileCheck className="h-4 w-4 mr-2" />
              Pending Review
            </TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-card">
              <UserCheck className="h-4 w-4 mr-2" />
              In Progress
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-card">
              <CheckCircle className="h-4 w-4 mr-2" />
              Completed
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-card">
              All Bookings
            </TabsTrigger>
          </TabsList>

          {['pending', 'review', 'completed', 'all'].map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="luxury-card p-6">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <Skeleton className="h-4 w-2/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))
              ) : (
                getRelevantBookings(tab).map((booking) => (
                  <div key={booking.id} className="luxury-card p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Booking Info */}
                      <div className="space-y-3 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-serif text-xl font-semibold">
                            {booking.customer_name}
                          </h3>
                          <Badge className={statusColors[booking.status]}>
                            {statusLabels[booking.status]}
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(booking.booking_date), 'PPP')}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            {booking.halls?.map(h => h.name).join(', ') || 'No venue'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            {booking.guest_count || 'N/A'} guests
                          </div>
                        </div>

                        <div className="text-sm">
                          <span className="text-muted-foreground">Event: </span>
                          <span>{booking.event_type || 'Not specified'}</span>
                          <span className="mx-2">•</span>
                          <span className="text-muted-foreground">Email: </span>
                          <span>{booking.customer_email}</span>
                        </div>

                        {booking.special_requests && (
                          <div className="p-3 bg-muted/50 rounded-lg text-sm">
                            <span className="font-medium">Special Requests: </span>
                            {booking.special_requests}
                          </div>
                        )}
                      </div>

                      {/* Right Side - Amount & Actions */}
                      <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="text-2xl font-serif font-bold flex items-center gap-1">
                            <DollarSign className="h-5 w-5" />
                            {booking.total_amount?.toLocaleString() || '0'}
                          </p>
                        </div>

                        {/* Admin Actions */}
                        <div className="flex flex-wrap gap-2">
                          {/* Admin1 Actions */}
                          {userRole === 'admin1' && (booking.status === 'pending' || booking.status === 'document_review') && (
                            <>
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => handleAction(booking, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Forward to Admin2
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAction(booking, 'request_changes')}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Request Changes
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleAction(booking, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Admin2 Actions */}
                          {userRole === 'admin2' && booking.status === 'availability_check' && (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAction(booking, 'request_payment')}
                              >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Request Payment
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleAction(booking, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}

                          {userRole === 'admin2' && booking.status === 'payment_pending' && (
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={() => handleAction(booking, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Forward to SuperAdmin
                            </Button>
                          )}

                          {/* SuperAdmin Actions */}
                          {userRole === 'super_admin' && booking.status === 'final_approval' && (
                            <>
                              <Button
                                variant="gold"
                                size="sm"
                                onClick={() => handleAction(booking, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve Booking
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleAction(booking, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {!isLoading && getRelevantBookings(tab).length === 0 && (
                <div className="luxury-card p-12 text-center">
                  <FileCheck className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-serif text-xl font-semibold mb-2">
                    No bookings in this category
                  </h3>
                  <p className="text-muted-foreground">
                    Bookings requiring your attention will appear here.
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' && 'Approve & Forward Booking'}
              {actionType === 'reject' && 'Reject Booking'}
              {actionType === 'request_changes' && 'Request Changes'}
              {actionType === 'request_payment' && 'Request Payment'}
            </DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                <>
                  Booking for {selectedBooking.customer_name} on{' '}
                  {format(new Date(selectedBooking.booking_date), 'PPP')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Add Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes for this action..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'reject' ? 'destructive' : 'gold'}
              onClick={confirmAction}
              disabled={updateBooking.isPending}
            >
              {updateBooking.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
