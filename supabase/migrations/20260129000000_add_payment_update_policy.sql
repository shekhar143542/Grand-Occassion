-- Add RLS policy for customers to update their own bookings for payment
-- Allows users to update payment status when booking is in payment_pending state

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can update own bookings for payment" ON public.bookings;

-- Create policy to allow users to update their own bookings
-- Only when status is payment_pending
-- Only allows updating to final_approval with payment_status = paid
CREATE POLICY "Users can update own bookings for payment"
ON public.bookings
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND status = 'payment_pending'
)
WITH CHECK (
  auth.uid() = user_id 
  AND status = 'final_approval' 
  AND payment_status = 'paid'
  AND payment_date IS NOT NULL
);

-- Add comment for documentation
COMMENT ON POLICY "Users can update own bookings for payment" ON public.bookings IS 
'Allows customers to mark their booking as paid and move it to final_approval stage when payment is completed';
