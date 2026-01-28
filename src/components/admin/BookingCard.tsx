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
  DollarSign,
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
    <div className="luxury-card p-6">
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
            {booking.payment_status === 'paid' && (
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                Paid
              </Badge>
            )}
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

          {booking.documents && booking.documents.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{booking.documents.length} document(s) uploaded</span>
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
            {booking.advance_amount && (
              <p className="text-sm text-muted-foreground">
                Advance: ${booking.advance_amount.toLocaleString()}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(booking)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>

            {/* Admin1 Actions */}
            {showAdmin1Actions && (
              <>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => onApprove?.(booking)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Docs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestChanges?.(booking)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject?.(booking)}
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
                  variant="secondary"
                  size="sm"
                  onClick={() => onRequestPayment?.(booking)}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Request Payment
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject?.(booking)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject (Unavailable)
                </Button>
              </>
            )}

            {/* Admin2 Payment Received Actions */}
            {showAdmin2PaymentActions && booking.payment_status === 'paid' && (
              <Button
                variant="gold"
                size="sm"
                onClick={() => onForwardToAdmin3?.(booking)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Forward to Admin3
              </Button>
            )}

            {/* Admin3 Actions */}
            {showAdmin3Actions && (
              <>
                <Button
                  variant="gold"
                  size="sm"
                  onClick={() => onApprove?.(booking)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Booking
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject?.(booking)}
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
                  variant="gold"
                  size="sm"
                  onClick={() => onApprove?.(booking)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Booking
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReject?.(booking)}
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
  );
}
