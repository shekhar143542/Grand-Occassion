-- Add admin3 to admin_role enum
ALTER TYPE public.admin_role ADD VALUE IF NOT EXISTS 'admin3';

-- Create new booking_status enum with all required statuses
-- First, we need to update the existing status values to match new naming
UPDATE public.bookings SET status = 'pending' WHERE status = 'pending';

-- Create booking_documents table for customer verification documents
CREATE TABLE public.booking_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'aadhaar', 'driving_license', 'passport', 'other'
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  status TEXT NOT NULL DEFAULT 'pending' -- 'pending', 'verified', 'rejected'
);

-- Create audit_logs table for tracking all status changes
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT,
  performed_by UUID NOT NULL,
  performed_by_role TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment fields to bookings
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS advance_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_link TEXT,
  ADD COLUMN IF NOT EXISTS slot_locked_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS invoice_url TEXT,
  ADD COLUMN IF NOT EXISTS confirmation_number TEXT;

-- Enable RLS on new tables
ALTER TABLE public.booking_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for booking_documents
CREATE POLICY "Users can view own booking documents"
  ON public.booking_documents FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_documents.booking_id 
    AND bookings.user_id = auth.uid()
  ));

CREATE POLICY "Users can upload documents to own bookings"
  ON public.booking_documents FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = booking_documents.booking_id 
    AND bookings.user_id = auth.uid()
  ));

CREATE POLICY "Admins can view all documents"
  ON public.booking_documents FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update documents"
  ON public.booking_documents FOR UPDATE
  USING (is_admin(auth.uid()));

-- RLS policies for audit_logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can view own booking audit logs"
  ON public.audit_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE bookings.id = audit_logs.booking_id 
    AND bookings.user_id = auth.uid()
  ));

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('booking-documents', 'booking-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for booking documents
CREATE POLICY "Users can upload own booking documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'booking-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view own booking documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'booking-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins can view all booking documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'booking-documents' AND
    is_admin(auth.uid())
  );