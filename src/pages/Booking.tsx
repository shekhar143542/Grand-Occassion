import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BanquetHall } from '@/lib/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentUpload } from '@/components/booking/DocumentUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { 
  CalendarIcon, 
  Clock, 
  Users, 
  ArrowLeft, 
  Check,
  Loader2,
  FileText
} from 'lucide-react';

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

const eventTypes = [
  'Wedding Reception',
  'Corporate Event',
  'Birthday Party',
  'Anniversary',
  'Engagement Party',
  'Conference',
  'Gala Dinner',
  'Other'
];

export default function BookingPage() {
  const [searchParams] = useSearchParams();
  const preselectedHall = searchParams.get('hall');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedHalls, setSelectedHalls] = useState<string[]>(
    preselectedHall ? [preselectedHall] : []
  );
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Fetch user profile for pre-fill
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCustomerName(data.full_name || '');
            setCustomerEmail(data.email || '');
            setCustomerPhone(data.phone || '');
          }
        });
    }
  }, [user]);

  const { data: halls, isLoading: hallsLoading } = useQuery({
    queryKey: ['booking-halls'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banquet_halls')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as BanquetHall[];
    },
  });

  const createBooking = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (!selectedDate || !startTime || !endTime || selectedHalls.length === 0) {
        throw new Error('Please fill in all required fields');
      }

      // Calculate total amount
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      const hours = endHour - startHour;

      if (hours < 4) {
        throw new Error('Minimum booking is 4 hours');
      }

      const selectedHallData = halls?.filter(h => selectedHalls.includes(h.id)) || [];
      const totalAmount = selectedHallData.reduce((sum, h) => sum + (h.price_per_hour * hours), 0);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          user_id: user.id,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: startTime,
          end_time: endTime,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone || null,
          event_type: eventType || null,
          guest_count: guestCount ? parseInt(guestCount) : null,
          special_requests: specialRequests || null,
          total_amount: totalAmount,
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Add selected halls
      const hallInserts = selectedHalls.map(hallId => ({
        booking_id: booking.id,
        hall_id: hallId,
      }));

      const { error: hallsError } = await supabase
        .from('booking_halls')
        .insert(hallInserts);

      if (hallsError) throw hallsError;

      return booking;
    },
    onSuccess: () => {
      toast({
        title: 'Booking submitted!',
        description: 'Your booking request has been submitted for review.',
      });
      navigate('/bookings');
    },
    onError: (error: any) => {
      toast({
        title: 'Booking failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const toggleHall = (hallId: string) => {
    setSelectedHalls(prev => 
      prev.includes(hallId) 
        ? prev.filter(id => id !== hallId)
        : [...prev, hallId]
    );
  };

  const calculateTotal = () => {
    if (!startTime || !endTime || selectedHalls.length === 0 || !halls) return 0;
    
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    const hours = endHour - startHour;
    
    if (hours <= 0) return 0;
    
    const selectedHallData = halls.filter(h => selectedHalls.includes(h.id));
    return selectedHallData.reduce((sum, h) => sum + (h.price_per_hour * hours), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-24 pb-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link to="/halls">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Venues
              </Link>
            </Button>
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              Book Your Event
            </h1>
            <p className="text-muted-foreground">
              Fill in the details below to request a booking
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-8">
              {/* Select Halls */}
              <div className="luxury-card p-6">
                <h3 className="font-serif text-xl font-semibold mb-4">Select Venues</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You can select multiple venues for your event
                </p>
                <div className="grid gap-3">
                  {hallsLoading ? (
                    <div className="text-center py-8">Loading venues...</div>
                  ) : (
                    halls?.map((hall) => (
                      <div
                        key={hall.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                          selectedHalls.includes(hall.id)
                            ? "border-secondary bg-secondary/5"
                            : "border-border hover:border-muted-foreground/30"
                        )}
                        onClick={() => toggleHall(hall.id)}
                      >
                        <Checkbox 
                          checked={selectedHalls.includes(hall.id)}
                          onCheckedChange={() => toggleHall(hall.id)}
                        />
                        <img
                          src={hall.panorama_url || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=100'}
                          alt={hall.name}
                          className="w-16 h-12 rounded-md object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{hall.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Up to {hall.capacity} guests • ${hall.price_per_hour}/hr
                          </p>
                        </div>
                        {selectedHalls.includes(hall.id) && (
                          <Check className="h-5 w-5 text-secondary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Date & Time */}
              <div className="luxury-card p-6">
                <h3 className="font-serif text-xl font-semibold mb-4">Date & Time</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Event Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="End time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem 
                            key={time} 
                            value={time}
                            disabled={startTime && time <= startTime}
                          >
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="luxury-card p-6">
                <h3 className="font-serif text-xl font-semibold mb-4">Your Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guests">Expected Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      placeholder="Number of guests"
                      value={guestCount}
                      onChange={(e) => setGuestCount(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Event Details */}
              <div className="luxury-card p-6">
                <h3 className="font-serif text-xl font-semibold mb-4">Event Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Event Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requests">Special Requests</Label>
                    <Textarea
                      id="requests"
                      placeholder="Any special requirements or requests for your event..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* Verification Documents Notice */}
              <div className="luxury-card p-6 border-secondary/30 bg-secondary/5">
                <div className="flex items-start gap-3">
                  <FileText className="h-6 w-6 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-serif text-xl font-semibold mb-2">Verification Documents Required</h3>
                    <p className="text-muted-foreground text-sm mb-3">
                      After submitting your booking, you'll need to upload verification documents (Aadhaar, Driving License, or Passport) for identity verification. Your booking will remain in "Documents Verification Pending" status until documents are approved.
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                      <li>Upload documents from "My Bookings" page after submission</li>
                      <li>Accepted formats: PDF, JPG, PNG</li>
                      <li>All documents are securely stored and verified</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="luxury-card p-6 sticky top-24">
                <h3 className="font-serif text-xl font-semibold mb-4">Booking Summary</h3>
                
                <div className="space-y-4 mb-6">
                  {selectedHalls.length > 0 ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Selected Venues</p>
                      <div className="space-y-2">
                        {halls?.filter(h => selectedHalls.includes(h.id)).map(hall => (
                          <div key={hall.id} className="flex justify-between text-sm">
                            <span>{hall.name}</span>
                            <span>${hall.price_per_hour}/hr</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No venues selected</p>
                  )}

                  {selectedDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>{format(selectedDate, 'PPP')}</span>
                    </div>
                  )}

                  {startTime && endTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Time</span>
                      <span>{startTime} - {endTime}</span>
                    </div>
                  )}
                </div>

                <div className="border-t pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Estimated Total</span>
                    <span className="text-2xl font-serif font-bold">
                      ${calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Final amount subject to approval
                  </p>
                </div>

                <Button
                  variant="gold"
                  size="lg"
                  className="w-full"
                  disabled={
                    createBooking.isPending ||
                    selectedHalls.length === 0 ||
                    !selectedDate ||
                    !startTime ||
                    !endTime ||
                    !customerName ||
                    !customerEmail
                  }
                  onClick={() => createBooking.mutate()}
                >
                  {createBooking.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Booking Request'
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By submitting, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
