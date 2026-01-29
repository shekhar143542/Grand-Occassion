import { Booking, statusLabels, statusColors, AdminRole } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare,
  IndianRupee,
  FileText,
  Eye,
} from 'lucide-react';

interface BookingCardProps {
  booking: Booking;
  userRole: AdminRole | null;
  onViewDetails: (booking: Booking) => void;
  onApprove?: (booking: Booking) => void;
  onReject?: (booking: Booking) => void;
  onRequestChanges?: (booking: Booking) => void;
  onRequestPayment?: (booking: Booking) => void;
  onForwardToAdmin3?: (booking: Booking) => void;
}

export function BookingCard({
  booking,
  userRole,
  onViewDetails,
  onApprove,
  onReject,
  onRequestChanges,
  onRequestPayment,
  onForwardToAdmin3,
}: BookingCardProps) {
  const showAdmin1Actions = userRole === 'admin1' && booking.status === 'pending';
  const showAdmin2AvailabilityActions = userRole === 'admin2' && booking.status === 'document_review';
  const showAdmin2PaymentActions = userRole === 'admin2' && booking.status === 'payment_pending';
  const showAdmin3Actions = userRole === 'admin3' && booking.status === 'final_approval';
  const showSuperAdminActions = userRole === 'super_admin' && booking.status === 'final_approval';

  return (
    <div className="group relative overflow-hidden">
      {/* Premium background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
      
      <div className="luxury-card p-6 border-primary/10 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left Section - Booking Info */}
          <div className="space-y-4 flex-1">
            {/* Header with Customer Name and Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-semibold text-foreground">
                    {booking.customer_name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{booking.customer_email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-auto">
                <Badge className={`${statusColors[booking.status]} px-3 py-1 text-xs font-medium`}>
                  {statusLabels[booking.status]}
                </Badge>
                {booking.payment_status === 'paid' && (
                  <Badge className="bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-500 border-green-500/30 px-3 py-1">
                    ✓ Paid
                  </Badge>
                )}
              </div>
            </div>

            {/* Event Details Grid */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Booking Date</p>
                  <p className="text-sm font-medium">{format(new Date(booking.booking_date), 'PPP')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Time Slot</p>
                  <p className="text-sm font-medium">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Venue</p>
                  <p className="text-sm font-medium">{booking.halls?.map(h => h.name).join(', ') || 'No venue'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Guest Count</p>
                  <p className="text-sm font-medium">{booking.guest_count || 'N/A'} guests</p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                <span className="text-muted-foreground">Event:</span>
                <span className="font-medium text-foreground">{booking.event_type || 'Not specified'}</span>
              </div>
              {booking.documents && booking.documents.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{booking.documents.length} document(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Amount & Actions */}
          <div className="flex flex-col gap-4 lg:min-w-[280px]">
            {/* Amount Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Total Amount</p>
              <div className="flex items-baseline gap-1">
                <IndianRupee className="h-5 w-5 text-primary" />
                <p className="text-3xl font-serif font-bold text-foreground">
                  {booking.total_amount?.toLocaleString() || '0'}
                </p>
              </div>
              {booking.advance_amount && (
                <div className="mt-2 pt-2 border-t border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    Advance: <span className="font-semibold text-foreground">₹{booking.advance_amount.toLocaleString()}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(booking)}
                className="w-full border-primary/30 hover:bg-primary/10 hover:border-primary/50"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>

              {/* Admin1 Actions */}
              {showAdmin1Actions && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onApprove?.(booking)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Docs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestChanges?.(booking)}
                    className="w-full border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onReject?.(booking)}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {/* Admin2 Availability Actions */}
              {showAdmin2AvailabilityActions && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onRequestPayment?.(booking)}
                    className="w-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
                  >
                    <IndianRupee className="h-4 w-4 mr-2" />
                    Request Payment
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onReject?.(booking)}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject (Unavailable)
                  </Button>
                </>
              )}

              {/* Admin2 Payment Received Actions */}
              {showAdmin2PaymentActions && booking.payment_status === 'paid' && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onForwardToAdmin3?.(booking)}
                  className="w-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Forward to Admin3
                </Button>
              )}

              {/* Admin3 Actions */}
              {showAdmin3Actions && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onApprove?.(booking)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Booking
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onReject?.(booking)}
                    className="w-full"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </>
              )}

              {/* SuperAdmin can approve final too */}
              {showSuperAdminActions && (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onApprove?.(booking)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Booking
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onReject?.(booking)}
                    className="w-full"
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
    </div>
  );
}
