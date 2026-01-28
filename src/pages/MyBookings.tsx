import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BanquetHall, BookingDocument, statusLabels, statusColors } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentUpload } from '@/components/booking/DocumentUpload';
import { BookingStatusProgress } from '@/components/booking/BookingStatusProgress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
  ChevronDown,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BookingWithDocs extends Booking {
  documents?: BookingDocument[];
}

export default function MyBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);

  const handlePayment = (booking: BookingWithDocs) => {
    if (booking.payment_link) {
      window.open(booking.payment_link, '_blank');
    } else {
      toast({
        title: 'Payment link not available',
        description: 'The admin will provide a payment link shortly.',
        variant: 'default',
      });
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
                My Bookings
              </h1>
              <p className="text-muted-foreground">
                Manage and track your venue bookings
              </p>
            </div>
            <Button variant="gold" asChild>
              <Link to="/halls">
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Link>
            </Button>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="luxury-card p-6">
                  <Skeleton className="h-6 w-1/3 mb-4" />
                  <Skeleton className="h-4 w-2/3 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))
            ) : bookings && bookings.length > 0 ? (
              bookings.map((booking) => (
                <Collapsible
                  key={booking.id}
                  open={expandedBooking === booking.id}
                  onOpenChange={(open) => setExpandedBooking(open ? booking.id : null)}
                >
                  <div className="luxury-card p-6">
                    {/* Status Progress - Shows tick marks for completed stages */}
                    <div className="mb-6">
                      <BookingStatusProgress
                        status={booking.status}
                        paymentStatus={booking.payment_status}
                        advanceAmount={booking.advance_amount}
                        onPayClick={() => handlePayment(booking)}
                      />
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      {/* Left Side - Booking Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-serif text-xl font-semibold">
                            {booking.event_type || 'Event'}
                          </h3>
                          <Badge className={statusColors[booking.status]}>
                            {statusLabels[booking.status]}
                          </Badge>
                          {booking.payment_status === 'paid' && (
                            <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                              Paid
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(booking.booking_date), 'PPP')}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm">
                          <MapPin className="h-4 w-4 text-secondary" />
                          <span>
                            {booking.halls?.map(h => h.name).join(', ') || 'No venue'}
                          </span>
                        </div>

                        {/* Document status indicator */}
                        {booking.documents && booking.documents.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {booking.documents.length} document(s) uploaded
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Amount & Actions */}
                      <div className="flex flex-col items-end gap-3">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Total Amount</p>
                          <p className="text-2xl font-serif font-bold">
                            ₹{booking.total_amount?.toLocaleString() || '0'}
                          </p>
                          {booking.advance_amount && (
                            <p className="text-xs text-muted-foreground">
                              Advance: ₹{booking.advance_amount.toLocaleString()}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {/* Show upload button for pending status */}
                          {(booking.status === 'pending' || booking.status === 'change_requested') && (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => openUploadDialog(booking.id)}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Docs
                            </Button>
                          )}

                          {booking.status === 'payment_pending' && (
                            <Button 
                              variant="gold" 
                              size="sm"
                              onClick={() => handlePayment(booking)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay ₹{booking.advance_amount?.toLocaleString() || 'Now'}
                            </Button>
                          )}

                          <CollapsibleTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${expandedBooking === booking.id ? 'rotate-180' : ''}`} />
                              Details
                            </Button>
                          </CollapsibleTrigger>

                          {booking.status === 'approved' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-2" />
                              Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <CollapsibleContent className="mt-4 pt-4 border-t space-y-4">
                      {/* Documents Section */}
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Uploaded Documents
                        </h4>
                        {booking.documents && booking.documents.length > 0 ? (
                          <div className="space-y-2">
                            {booking.documents.map((doc) => (
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
                            {(booking.status === 'pending' || booking.status === 'change_requested') && (
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                className="mt-3"
                                onClick={() => openUploadDialog(booking.id)}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Documents
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Admin Notes */}
                      {(booking.admin1_notes || booking.admin2_notes || booking.super_admin_notes) && (
                        <div>
                          <h4 className="font-semibold mb-2">Notes from Admin</h4>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              {booking.super_admin_notes || booking.admin2_notes || booking.admin1_notes}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Booking Details */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold mb-2">Event Information</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Event Type:</span> {booking.event_type || 'Not specified'}</p>
                            <p><span className="text-muted-foreground">Guest Count:</span> {booking.guest_count || 'Not specified'}</p>
                            {booking.special_requests && (
                              <p><span className="text-muted-foreground">Special Requests:</span> {booking.special_requests}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Booking Reference</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="text-muted-foreground">Booking ID:</span> {booking.id.slice(0, 8)}...</p>
                            {booking.confirmation_number && (
                              <p><span className="text-muted-foreground">Confirmation:</span> {booking.confirmation_number}</p>
                            )}
                            <p><span className="text-muted-foreground">Created:</span> {format(new Date(booking.created_at), 'PPp')}</p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))
            ) : (
              <div className="luxury-card p-12 text-center">
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
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  );
}
