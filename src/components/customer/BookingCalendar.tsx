import { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Booking, BanquetHall, statusColors, statusLabels } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingCalendarProps {
  bookings: (Booking & { halls: BanquetHall[] })[];
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}

export function BookingCalendar({ bookings, selectedDate, onSelectDate }: BookingCalendarProps) {
  // Get dates that have bookings
  const bookingDates = useMemo(() => {
    return bookings.map((b) => parseISO(b.booking_date));
  }, [bookings]);

  // Get bookings for selected date
  const selectedDateBookings = useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter((b) => isSameDay(parseISO(b.booking_date), selectedDate));
  }, [bookings, selectedDate]);

  // Custom day content to show booking indicators
  const modifiers = {
    hasBooking: bookingDates,
  };

  const modifiersStyles = {
    hasBooking: {
      fontWeight: 'bold' as const,
    },
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Event Calendar
          </CardTitle>
          <CardDescription>Click on a date to view your bookings</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelectDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border pointer-events-auto"
            components={{
              DayContent: ({ date }) => {
                const hasBooking = bookingDates.some((d) => isSameDay(d, date));
                return (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {hasBooking && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-secondary" />
                    )}
                  </div>
                );
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a Date'}
          </CardTitle>
          <CardDescription>
            {selectedDateBookings.length > 0
              ? `${selectedDateBookings.length} booking${selectedDateBookings.length > 1 ? 's' : ''} on this day`
              : selectedDate
              ? 'No bookings on this date'
              : 'Choose a date from the calendar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateBookings.length > 0 ? (
            <div className="space-y-4">
              {selectedDateBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{booking.event_type || 'Event'}</h4>
                    <Badge className={cn(statusColors[booking.status], 'text-xs')}>
                      {statusLabels[booking.status]}
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{booking.halls?.[0]?.name || 'Venue'}</span>
                    </div>
                  </div>
                  {booking.total_amount && (
                    <p className="mt-2 font-semibold text-foreground">
                      ₹{booking.total_amount.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {selectedDate ? 'No events scheduled' : 'Select a date to view bookings'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
