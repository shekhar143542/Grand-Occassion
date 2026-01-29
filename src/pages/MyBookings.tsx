import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BanquetHall, BookingDocument, statusLabels, statusColors } from '@/lib/types';
import { generateInvoice } from '@/lib/invoiceGenerator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentUpload } from '@/components/booking/DocumentUpload';
import { BookingStatusProgress } from '@/components/booking/BookingStatusProgress';
import { PaymentDialog } from '@/components/booking/PaymentDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Download,
  FileText,
  CreditCard,
  Upload,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  ArrowLeft,
  Crown,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingWithDocs extends Booking {
  documents?: BookingDocument[];
  halls?: BanquetHall[];
}

export default function MyBookingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDocs | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentBooking, setPaymentBooking] = useState<BookingWithDocs | null>(null);

  const handlePayment = (booking: BookingWithDocs) => {
    setPaymentBooking(booking);
    setPaymentDialogOpen(true);
  };

  const handleDownloadInvoice = async (booking: BookingWithDocs) => {
    if (!user) return;

    try {
      // Get user profile for customer details
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      generateInvoice({
        booking,
        halls: booking.halls || [],
        customerName: profile?.full_name || 'Customer',
        customerEmail: profile?.email || user.email || '',
      });

      toast({
        title: 'Invoice Downloaded',
        description: 'Your invoice has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Invoice generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate invoice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentBooking) return;

    try {
      // Update booking status to final_approval (payment completed)
      const { error } = await supabase
        .from('bookings')
        .update({
          payment_status: 'paid',
          status: 'final_approval',
          payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', paymentBooking.id);

      if (error) throw error;

      toast({
        title: 'Payment Successful!',
        description: 'Your booking is being sent for final approval.',
      });

      // Refresh bookings
      await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });

      // Close dialogs
      setPaymentDialogOpen(false);
      setDetailsDialogOpen(false);
      
      // Redirect to my bookings page
      navigate('/bookings', { replace: true });
    } catch (error) {
      console.error('Payment update error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status. Please contact support.',
        variant: 'destructive',
      });
    }
  };

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch booking halls and documents for each booking
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

      return bookingsWithDetails as BookingWithDocs[];
    },
    enabled: !!user,
  });

  const openUploadDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setUploadDialogOpen(true);
  };

  const openDetailsDialog = (booking: BookingWithDocs) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const handleUploadComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
  };

  const getDocStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-12 w-12 text-secondary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Header with Back Button */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b">
        <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-secondary" />
            <span className="font-serif text-lg font-semibold text-foreground">
              Grand Occasion
            </span>
          </div>

          <Button variant="gold" asChild size="sm">
            <Link to="/halls">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Link>
          </Button>
        </nav>
      </header>

      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              My Bookings
            </h1>
            <p className="text-muted-foreground">
              Manage and track your venue bookings
            </p>
          </div>

          {/* Bookings Grid */}
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </Card>
              ))}
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Venue Image */}
                  <div className="relative h-40 bg-gradient-to-br from-primary/10 to-secondary/10">
                    {booking.halls?.[0]?.images?.[0] ? (
                      <img
                        src={booking.halls[0].images[0]}
                        alt={booking.halls[0].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-serif text-lg font-semibold line-clamp-1">
                          {booking.event_type || 'Event'}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {booking.halls?.map(h => h.name).join(', ') || 'No venue'}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end flex-shrink-0">
                        <Badge className={statusColors[booking.status]}>
                          {statusLabels[booking.status]}
                        </Badge>
                        {booking.payment_status === 'paid' && (
                          <Badge className="bg-green-500/90 text-white">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Paid
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-2">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(booking.booking_date), 'PP')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </div>
                      {booking.guest_count && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {booking.guest_count} guests
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-serif font-bold">
                          ₹{booking.total_amount?.toLocaleString() || '0'}
                        </p>
                      </div>
                      {booking.documents && booking.documents.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <FileText className="h-3.5 w-3.5" />
                          {booking.documents.length} doc(s)
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-2 pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDetailsDialog(booking)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View More
                    </Button>

                    {booking.status === 'payment_pending' && (
                      <Button
                        variant="gold"
                        size="sm"
                        onClick={() => handlePayment(booking)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay
                      </Button>
                    )}

                    {(booking.status === 'pending' || booking.status === 'change_requested') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openUploadDialog(booking.id)}
                      >
                        <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="font-serif text-2xl font-semibold text-foreground mb-2">
                No Bookings Yet
              </h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any bookings yet. Explore our venues and book your first event!
              </p>
              <Button variant="gold" asChild>
                <Link to="/halls">
                  Explore Venues
                </Link>
              </Button>
            </Card>
          )}
        </div>
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {selectedBooking?.event_type || 'Booking Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Status Progress */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <BookingStatusProgress
                  status={selectedBooking.status}
                  paymentStatus={selectedBooking.payment_status}
                  advanceAmount={selectedBooking.advance_amount}
                  onPayClick={() => handlePayment(selectedBooking)}
                />
              </div>

              {/* Venue Info */}
              {selectedBooking.halls && selectedBooking.halls.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-secondary" />
                    Venue
                  </h4>
                  <div className="flex gap-4 items-center p-3 bg-muted/50 rounded-lg">
                    {selectedBooking.halls[0].images?.[0] && (
                      <img
                        src={selectedBooking.halls[0].images[0]}
                        alt={selectedBooking.halls[0].name}
                        className="h-20 w-20 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{selectedBooking.halls.map(h => h.name).join(', ')}</p>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {selectedBooking.halls[0].capacity} guests
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">Event Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(selectedBooking.booking_date), 'PPP')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.start_time.slice(0, 5)} - {selectedBooking.end_time.slice(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedBooking.guest_count || 'Not specified'} guests</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-muted-foreground">Total Amount:</span> ₹{selectedBooking.total_amount?.toLocaleString() || '0'}</p>
                    {selectedBooking.advance_amount && (
                      <p><span className="text-muted-foreground">Advance:</span> ₹{selectedBooking.advance_amount.toLocaleString()}</p>
                    )}
                    <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="ml-1 capitalize">{selectedBooking.payment_status}</Badge></p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.special_requests && (
                <div>
                  <h4 className="font-semibold mb-2">Special Requests</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                    {selectedBooking.special_requests}
                  </p>
                </div>
              )}

              {/* Documents Section */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Uploaded Documents
                </h4>
                {selectedBooking.documents && selectedBooking.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedBooking.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.document_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {doc.document_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getDocStatusIcon(doc.status)}
                          <span className="text-xs capitalize">{doc.status}</span>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-muted/30 rounded-lg">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                    {(selectedBooking.status === 'pending' || selectedBooking.status === 'change_requested') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-3"
                        onClick={() => {
                          setDetailsDialogOpen(false);
                          openUploadDialog(selectedBooking.id);
                        }}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Documents
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {(selectedBooking.admin1_notes || selectedBooking.admin2_notes || selectedBooking.super_admin_notes) && (
                <div>
                  <h4 className="font-semibold mb-2">Notes from Admin</h4>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {selectedBooking.super_admin_notes || selectedBooking.admin2_notes || selectedBooking.admin1_notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Booking Reference */}
              <div className="pt-4 border-t text-sm text-muted-foreground">
                <p>Booking ID: {selectedBooking.id.slice(0, 8)}...</p>
                {selectedBooking.confirmation_number && (
                  <p>Confirmation: {selectedBooking.confirmation_number}</p>
                )}
                <p>Created: {format(new Date(selectedBooking.created_at), 'PPp')}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                {selectedBooking.status === 'payment_pending' && (
                  <Button
                    variant="gold"
                    className="flex-1"
                    onClick={() => handlePayment(selectedBooking)}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay ₹{selectedBooking.advance_amount?.toLocaleString() || 'Now'}
                  </Button>
                )}

                {(selectedBooking.status === 'pending' || selectedBooking.status === 'change_requested') && (
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setDetailsDialogOpen(false);
                      openUploadDialog(selectedBooking.id);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Documents
                  </Button>
                )}

                {selectedBooking.status === 'approved' && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleDownloadInvoice(selectedBooking)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Invoice
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Verification Documents</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Upload your identity verification documents. Accepted documents include Aadhaar Card, Driving License, or Passport.
            </p>
            {selectedBookingId && (
              <DocumentUpload
                bookingId={selectedBookingId}
                onUploadComplete={handleUploadComplete}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {paymentBooking && (
        <PaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          bookingId={paymentBooking.id}
          amount={paymentBooking.advance_amount || paymentBooking.total_amount || 0}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
