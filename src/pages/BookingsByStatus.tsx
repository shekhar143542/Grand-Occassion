import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Booking, BanquetHall, BookingStatus, statusLabels, statusColors } from '@/lib/types';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Database } from '@/integrations/supabase/types';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import {
  Crown,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  FileQuestion,
} from 'lucide-react';

const statusConfig: Record<string, { title: string; description: string; icon: any; color: string }> = {
  pending: {
    title: 'Pending Requests',
    description: 'Bookings awaiting document verification',
    icon: AlertCircle,
    color: 'text-amber-500',
  },
  payment_pending: {
    title: 'Payment Required',
    description: 'Bookings awaiting payment',
    icon: CreditCard,
    color: 'text-purple-500',
  },
  approved: {
    title: 'Approved Bookings',
    description: 'Confirmed and approved bookings',
    icon: CheckCircle,
    color: 'text-green-500',
  },
  rejected: {
    title: 'Rejected Requests',
    description: 'Bookings that were not approved',
    icon: XCircle,
    color: 'text-red-500',
  },
};

type DbBookingStatus = Database['public']['Enums']['booking_status'];

export default function BookingsByStatus() {
  const { status } = useParams<{ status: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const validStatuses: DbBookingStatus[] = ['pending', 'payment_pending', 'approved', 'rejected'];
  const isValidStatus = status && validStatuses.includes(status as DbBookingStatus);

  const config = statusConfig[status || ''] || {
    title: 'Bookings',
    description: 'All your bookings',
    icon: FileQuestion,
    color: 'text-muted-foreground',
  };

  const StatusIcon = config.icon;

  // Fetch bookings filtered by status
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['bookings-by-status', user?.id, status],
    queryFn: async () => {
      if (!user || !isValidStatus) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', status as DbBookingStatus)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch halls for each booking
      const bookingsWithHalls = await Promise.all(
        (data || []).map(async (booking) => {
          const { data: bookingHalls } = await supabase
            .from('booking_halls')
            .select('hall_id')
            .eq('booking_id', booking.id);

          let halls: BanquetHall[] = [];
          if (bookingHalls && bookingHalls.length > 0) {
            const hallIds = bookingHalls.map((bh) => bh.hall_id);
            const { data: hallsData } = await supabase
              .from('banquet_halls')
              .select('*')
              .in('id', hallIds);
            halls = (hallsData as BanquetHall[]) || [];
          }

          return { ...booking, halls };
        })
      );

      return bookingsWithHalls as (Booking & { halls: BanquetHall[] })[];
    },
    enabled: !!user && isValidStatus,
  });

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

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <CustomerSidebar />

        <SidebarInset className="flex-1">
          {/* Header */}
          <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6">
            <SidebarTrigger className="-ml-2" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-secondary" />
              <span className="font-serif text-lg font-semibold hidden sm:inline">
                Grand Occasion
              </span>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full bg-muted ${config.color}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-bold">{config.title}</h1>
                <p className="text-muted-foreground">{config.description}</p>
              </div>
            </div>

            {/* Bookings List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StatusIcon className={`h-5 w-5 ${config.color}`} />
                  {config.title}
                </CardTitle>
                <CardDescription>
                  {bookings?.length || 0} booking(s) found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : bookings && bookings.length > 0 ? (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <Link
                        key={booking.id}
                        to="/bookings"
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {booking.event_type || 'Event'}
                            </span>
                            <Badge className={statusColors[booking.status]}>
                              {statusLabels[booking.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(booking.booking_date), 'PP')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {booking.start_time.slice(0, 5)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {booking.halls?.[0]?.name || 'Venue'}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ₹{booking.total_amount?.toLocaleString() || '0'}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <StatusIcon className={`h-16 w-16 mx-auto mb-4 ${config.color} opacity-50`} />
                    <h3 className="text-lg font-medium mb-2">No {config.title.toLowerCase()}</h3>
                    <p className="text-muted-foreground mb-6">
                      You don't have any bookings with this status yet.
                    </p>
                    <Button variant="gold" asChild>
                      <Link to="/halls">Book a Venue</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
