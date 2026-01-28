import { useState } from 'react';
import { Booking, BookingStatus, AdminRole } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export type ActionType = 'approve' | 'reject' | 'request_changes' | 'request_payment' | 'forward_admin3';

interface ActionDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: ActionType;
  userRole: AdminRole | null;
  onConfirm: (notes: string, advanceAmount?: number) => void;
  isLoading?: boolean;
}

const actionTitles: Record<ActionType, string> = {
  approve: 'Approve & Forward',
  reject: 'Reject Booking',
  request_changes: 'Request Changes',
  request_payment: 'Request Payment',
  forward_admin3: 'Forward to Admin3',
};

const actionDescriptions: Record<ActionType, string> = {
  approve: 'Approve this booking and forward it to the next admin for review.',
  reject: 'Reject this booking. The customer will be notified.',
  request_changes: 'Request changes from the customer. They will receive a notification with your notes.',
  request_payment: 'Request advance payment from the customer. Specify the amount required.',
  forward_admin3: 'Forward this booking to Admin3 for final approval.',
};

export function ActionDialog({
  booking,
  open,
  onOpenChange,
  actionType,
  userRole,
  onConfirm,
  isLoading,
}: ActionDialogProps) {
  const [notes, setNotes] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');

  const handleConfirm = () => {
    onConfirm(
      notes,
      actionType === 'request_payment' ? parseFloat(advanceAmount) : undefined
    );
    setNotes('');
    setAdvanceAmount('');
  };

  const isNotesRequired = actionType === 'reject' || actionType === 'request_changes';
  const isAmountRequired = actionType === 'request_payment';
  const canConfirm = 
    (!isNotesRequired || notes.trim()) && 
    (!isAmountRequired || (advanceAmount && parseFloat(advanceAmount) > 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionTitles[actionType]}</DialogTitle>
          <DialogDescription>
            {booking && (
              <span className="block mt-2">
                Booking for <strong>{booking.customer_name}</strong> on{' '}
                <strong>{new Date(booking.booking_date).toLocaleDateString()}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            {actionDescriptions[actionType]}
          </p>

          {isAmountRequired && (
            <div className="space-y-2">
              <Label htmlFor="amount">Advance Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter advance amount"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                min="0"
                step="100"
              />
              {booking?.total_amount && (
                <p className="text-xs text-muted-foreground">
                  Total booking amount: ${booking.total_amount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              {isNotesRequired ? 'Reason / Notes *' : 'Notes (optional)'}
            </Label>
            <Textarea
              id="notes"
              placeholder={
                actionType === 'reject'
                  ? 'Please provide a reason for rejection...'
                  : actionType === 'request_changes'
                  ? 'Describe what changes are needed...'
                  : 'Add any notes for this action...'
              }
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'reject' ? 'destructive' : 'default'}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
