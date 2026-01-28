import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Booking, BanquetHall, statusLabels, statusColors } from '@/lib/types';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  Search,
  Crown,
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  CreditCard,
  Plus,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(45, 70%, 50%)', 'hsl(200, 70%, 50%)'];

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customer bookings
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['customer-bookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
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
    enabled: !!user,
  });

  // Fetch all halls for search
  const { data: allHalls } = useQuery({
    queryKey: ['all-halls-search'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banquet_halls')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data as BanquetHall[];
    },
  });

  // Calculate statistics
  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b) => b.status === 'pending').length || 0,
    approved: bookings?.filter((b) => b.status === 'approved').length || 0,
    paymentPending: bookings?.filter((b) => b.status === 'payment_pending').length || 0,
    rejected: bookings?.filter((b) => b.status === 'rejected').length || 0,
  };

  // Prepare chart data - Hall booking frequency
  const hallBookingCounts: Record<string, number> = {};
  bookings?.forEach((booking) => {
    booking.halls?.forEach((hall) => {
      hallBookingCounts[hall.name] = (hallBookingCounts[hall.name] || 0) + 1;
    });
  });

  const hallChartData = Object.entries(hallBookingCounts)
    .map(([name, count]) => ({ name, bookings: count }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Pending', value: stats.pending, color: 'hsl(45, 70%, 50%)' },
    { name: 'Approved', value: stats.approved, color: 'hsl(142, 71%, 45%)' },
    { name: 'Payment Pending', value: stats.paymentPending, color: 'hsl(280, 70%, 50%)' },
    { name: 'Rejected', value: stats.rejected, color: 'hsl(0, 84%, 60%)' },
  ].filter((item) => item.value > 0);

  // Filter halls based on search
  const filteredHalls = allHalls?.filter(
    (hall) =>
      hall.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hall.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recent bookings
  const recentBookings = bookings?.slice(0, 5) || [];

  // Redirect to login if not authenticated - must be after all hooks
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
            
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-secondary" />
              <span className="font-serif text-lg font-semibold hidden sm:inline">
                Royal Banquets
              </span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search venues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button variant="gold" asChild size="sm">
              <Link to="/halls">
                <Plus className="h-4 w-4 mr-2" />
                Book Now
              </Link>
            </Button>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Search Results */}
            {searchQuery && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredHalls && filteredHalls.length > 0 ? (
                    <div className="grid gap-3">
                      {filteredHalls.slice(0, 4).map((hall) => (
                        <Link
                          key={hall.id}
                          to={`/halls/${hall.id}`}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
                            {hall.images[0] && (
                              <img
                                src={hall.images[0]}
                                alt={hall.name}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{hall.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {hall.capacity} guests • ₹{hall.price_per_hour}/hr
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No venues found matching "{searchQuery}"
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">All time bookings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Pending</CardTitle>
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
                  <p className="text-xs text-muted-foreground">Awaiting review</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Payment Pending</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-500">{stats.paymentPending}</div>
                  <p className="text-xs text-muted-foreground">Awaiting payment</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Approved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
                  <p className="text-xs text-muted-foreground">Confirmed bookings</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Hall Booking Frequency */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Most Booked Venues
                  </CardTitle>
                  <CardDescription>Your frequently booked venues</CardDescription>
                </CardHeader>
                <CardContent>
                  {hallChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={hallChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="bookings"
                          stroke="hsl(var(--secondary))"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No booking data yet
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking Status Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Status</CardTitle>
                  <CardDescription>Distribution of your booking statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No booking data yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Bookings */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Bookings</CardTitle>
                  <CardDescription>Your latest booking requests</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/bookings">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="space-y-3">
                    {recentBookings.map((booking) => (
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
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No bookings yet</p>
                    <Button variant="gold" asChild>
                      <Link to="/halls">Book Your First Venue</Link>
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
