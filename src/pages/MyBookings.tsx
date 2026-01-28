import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Booking, BanquetHall, statusLabels, statusColors } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus,
  Download,
  FileText,
  CreditCard
} from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

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

      // Fetch booking halls for each booking
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
    enabled: !!user,
  });

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
                <div key={booking.id} className="luxury-card p-6">
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
                    </div>

                    {/* Right Side - Amount & Actions */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-2xl font-serif font-bold">
                          ${booking.total_amount?.toLocaleString() || '0'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {booking.status === 'payment_pending' && (
                          <Button variant="gold" size="sm">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        {booking.status === 'approved' && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Invoice
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {(booking.admin1_notes || booking.admin2_notes || booking.super_admin_notes) && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Notes from Admin:</p>
                      <p className="text-sm text-muted-foreground">
                        {booking.super_admin_notes || booking.admin2_notes || booking.admin1_notes}
                      </p>
                    </div>
                  )}
                </div>
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
    </div>
  );
}
