import { useState, useEffect } from 'react';
import { Booking, BookingDocument, AuditLog, statusLabels, statusColors } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Download,
  Eye,
  IndianRupee,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface BookingDetailsDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BookingDetailsDialog({
  booking,
  open,
  onOpenChange,
}: BookingDetailsDialogProps) {
  const [documents, setDocuments] = useState<BookingDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking && open) {
      fetchDetails();
    }
  }, [booking, open]);

  const fetchDetails = async () => {
    if (!booking) return;
    setLoading(true);

    // Fetch documents
    const { data: docs } = await supabase
      .from('booking_documents')
      .select('*')
      .eq('booking_id', booking.id)
      .order('uploaded_at', { ascending: false });

    // Fetch audit logs
    const { data: logs } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('booking_id', booking.id)
      .order('created_at', { ascending: false });

    setDocuments((docs as BookingDocument[]) || []);
    setAuditLogs((logs as AuditLog[]) || []);
    setLoading(false);
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="font-serif text-2xl">{booking.customer_name}</span>
            <Badge className={statusColors[booking.status]}>
              {statusLabels[booking.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">
              Documents ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="history">
              History ({auditLogs.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            {/* Customer Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Customer Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> {booking.customer_name}</p>
                  <p><span className="text-muted-foreground">Email:</span> {booking.customer_email}</p>
                  <p><span className="text-muted-foreground">Phone:</span> {booking.customer_phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Event Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(booking.booking_date), 'PPPP')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    {booking.guest_count || 'N/A'} guests
                  </div>
                  <p><span className="text-muted-foreground">Event Type:</span> {booking.event_type || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Venues */}
            <div>
              <h4 className="font-semibold text-lg mb-3">Selected Venues</h4>
              <div className="flex flex-wrap gap-2">
                {booking.halls?.map(hall => (
                  <div key={hall.id} className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-4 w-4 text-secondary" />
                    <span>{hall.name}</span>
                    <span className="text-muted-foreground">(₹{hall.price_per_hour}/hr)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <IndianRupee className="h-5 w-5" />
                  Payment Details
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Amount</span>
                    <span className="font-semibold">₹{booking.total_amount?.toLocaleString() || '0'}</span>
                  </div>
                  {booking.advance_amount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Advance Amount</span>
                      <span>₹{booking.advance_amount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status</span>
                    <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                      {booking.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>

              {booking.special_requests && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">Special Requests</h4>
                  <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
                </div>
              )}
            </div>

            {/* Admin Notes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Admin Notes</h4>
              <div className="grid md:grid-cols-3 gap-4">
                {booking.admin1_notes && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Admin1 Notes</p>
                    <p className="text-sm">{booking.admin1_notes}</p>
                  </div>
                )}
                {booking.admin2_notes && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Admin2 Notes</p>
                    <p className="text-sm">{booking.admin2_notes}</p>
                  </div>
                )}
                {booking.super_admin_notes && (
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">SuperAdmin Notes</p>
                    <p className="text-sm">{booking.super_admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.document_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type.replace('_', ' ')} • Uploaded {format(new Date(doc.uploaded_at), 'PPp')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          doc.status === 'verified'
                            ? 'bg-green-500/20 text-green-500'
                            : doc.status === 'rejected'
                              ? 'bg-red-500/20 text-red-500'
                              : 'bg-amber-500/20 text-amber-500'
                        }
                      >
                        {doc.status === 'verified' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {doc.status === 'rejected' && <XCircle className="h-3 w-3 mr-1" />}
                        {doc.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {doc.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={doc.file_url} download>
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No history yet</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                <div className="space-y-4">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex gap-4 pl-8 relative">
                      <div className="absolute left-2.5 w-3 h-3 rounded-full bg-secondary border-2 border-background" />
                      <div className="flex-1 p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{log.action}</p>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), 'PPp')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="secondary">{log.performed_by_role}</Badge>
                          {log.previous_status && log.new_status && (
                            <>
                              <span className="text-muted-foreground">{log.previous_status}</span>
                              <span>→</span>
                              <span className="text-muted-foreground">{log.new_status}</span>
                            </>
                          )}
                        </div>
                        {log.reason && (
                          <p className="text-sm text-muted-foreground mt-2">{log.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
