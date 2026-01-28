import { BookingStatus } from '@/lib/types';
import { CheckCircle, Circle, Clock, CreditCard, FileCheck, ShieldCheck, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookingStatusProgressProps {
  status: BookingStatus;
  paymentStatus?: string;
  advanceAmount?: number | null;
  onPayClick?: () => void;
}

interface Step {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const steps: Step[] = [
  {
    id: 'submitted',
    label: 'Submitted',
    description: 'Booking request received',
    icon: FileCheck,
  },
  {
    id: 'admin1',
    label: 'Document Verification',
    description: 'Admin1 reviewing documents',
    icon: ShieldCheck,
  },
  {
    id: 'admin2',
    label: 'Availability & Payment',
    description: 'Admin2 checking availability',
    icon: CreditCard,
  },
  {
    id: 'admin3',
    label: 'Final Approval',
    description: 'Admin3 final review',
    icon: ShieldCheck,
  },
  {
    id: 'approved',
    label: 'Approved',
    description: 'Booking confirmed',
    icon: CheckCircle,
  },
];

export function BookingStatusProgress({
  status,
  paymentStatus,
  advanceAmount,
  onPayClick,
}: BookingStatusProgressProps) {
  const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' | 'rejected' => {
    if (status === 'rejected') {
      return 'rejected';
    }

    const statusMap: Record<string, number> = {
      pending: 1,
      change_requested: 1,
      document_review: 2,
      availability_check: 2,
      payment_pending: 2,
      payment_completed: 2,
      final_approval: 3,
      approved: 4,
    };

    const stepOrder: Record<string, number> = {
      submitted: 0,
      admin1: 1,
      admin2: 2,
      admin3: 3,
      approved: 4,
    };

    const currentStep = statusMap[status] ?? 0;
    const stepIndex = stepOrder[stepId] ?? 0;

    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const isRejected = status === 'rejected';
  const isChangeRequested = status === 'change_requested';
  const showPaymentOption = status === 'payment_pending' && advanceAmount;

  return (
    <div className="space-y-4">
      {/* Rejected Banner */}
      {isRejected && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-medium text-red-500">Booking Rejected</p>
            <p className="text-sm text-muted-foreground">Your booking has been rejected by the admin.</p>
          </div>
        </div>
      )}

      {/* Change Requested Banner */}
      {isChangeRequested && (
        <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <Clock className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="font-medium text-yellow-500">Changes Requested</p>
            <p className="text-sm text-muted-foreground">
              Please review admin notes and update your documents.
            </p>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      {!isRejected && (
        <div className="relative">
          <div className="flex justify-between">
            {steps.map((step, index) => {
              const stepStatus = getStepStatus(step.id);
              const Icon = step.icon;
              const isLast = index === steps.length - 1;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex flex-col items-center relative',
                    !isLast && 'flex-1'
                  )}
                >
                  {/* Connector Line */}
                  {!isLast && (
                    <div
                      className={cn(
                        'absolute top-5 left-[calc(50%+16px)] right-0 h-0.5',
                        stepStatus === 'completed' ? 'bg-green-500' : 'bg-muted'
                      )}
                    />
                  )}

                  {/* Step Circle */}
                  <div
                    className={cn(
                      'relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2',
                      stepStatus === 'completed' &&
                        'bg-green-500 border-green-500 text-white',
                      stepStatus === 'current' &&
                        'bg-secondary/20 border-secondary text-secondary animate-pulse',
                      stepStatus === 'pending' &&
                        'bg-muted border-muted-foreground/30 text-muted-foreground',
                      stepStatus === 'rejected' &&
                        'bg-red-500/20 border-red-500 text-red-500'
                    )}
                  >
                    {stepStatus === 'completed' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>

                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={cn(
                        'text-xs font-medium',
                        stepStatus === 'completed' && 'text-green-500',
                        stepStatus === 'current' && 'text-secondary',
                        stepStatus === 'pending' && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment Option */}
      {showPaymentOption && (
        <div className="mt-6 p-4 bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/30 rounded-lg">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="font-semibold text-secondary">Payment Required</p>
              <p className="text-sm text-muted-foreground">
                Admin has approved your booking. Please pay the advance amount to proceed.
              </p>
              <p className="text-2xl font-bold mt-2">
                ₹{advanceAmount?.toLocaleString()}
              </p>
            </div>
            <button
              onClick={onPayClick}
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold hover:bg-secondary/90 transition-colors flex items-center gap-2"
            >
              <CreditCard className="h-5 w-5" />
              Pay Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
