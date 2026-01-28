export type AdminRole = 'admin1' | 'admin2' | 'admin3' | 'super_admin';

export type BookingStatus = 
  | 'pending'           // ActionPending - Initial status
  | 'change_requested'  // ChangeRequested - Changes requested by admin
  | 'rejected'          // Rejected - Booking rejected
  | 'document_review'   // PendingAdmin2 - Waiting for Admin2
  | 'availability_check' // PendingAdmin2 - Admin2 checking availability
  | 'payment_pending'   // PaymentRequested - Waiting for payment
  | 'payment_completed' // PaymentCompleted - Payment received (virtual status)
  | 'final_approval'    // PendingFinalApproval - Waiting for Admin3
  | 'approved';         // Approved - Booking confirmed

export interface BanquetHall {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  price_per_hour: number;
  amenities: string[];
  images: string[];
  panorama_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingDocument {
  id: string;
  booking_id: string;
  document_type: 'aadhaar' | 'driving_license' | 'passport' | 'other';
  document_name: string;
  file_url: string;
  uploaded_at: string;
  verified_at: string | null;
  verified_by: string | null;
  status: 'pending' | 'verified' | 'rejected';
}

export interface AuditLog {
  id: string;
  booking_id: string;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  performed_by: string;
  performed_by_role: string;
  reason: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  total_amount: number | null;
  notes: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_type: string | null;
  guest_count: number | null;
  special_requests: string | null;
  admin1_notes: string | null;
  admin2_notes: string | null;
  super_admin_notes: string | null;
  payment_status: string;
  payment_date: string | null;
  advance_amount: number | null;
  payment_link: string | null;
  slot_locked_until: string | null;
  invoice_url: string | null;
  confirmation_number: string | null;
  created_at: string;
  updated_at: string;
  halls?: BanquetHall[];
  documents?: BookingDocument[];
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AdminRole;
  created_by: string | null;
  created_at: string;
}

export const statusLabels: Record<BookingStatus, string> = {
  pending: 'Documents Verification Pending',
  document_review: 'Pending Admin2 Review',
  availability_check: 'Checking Availability',
  payment_pending: 'Payment Pending',
  payment_completed: 'Payment Completed',
  final_approval: 'Pending Final Approval',
  approved: 'Approved',
  change_requested: 'Changes Requested',
  rejected: 'Rejected',
};

export const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
  document_review: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  availability_check: 'bg-cyan-500/20 text-cyan-500 border-cyan-500/30',
  payment_pending: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  payment_completed: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
  final_approval: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
  approved: 'bg-green-500/20 text-green-500 border-green-500/30',
  change_requested: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
};

export const roleDescriptions: Record<AdminRole, string> = {
  admin1: 'Document Verification - Review booking documents and verify customer identity',
  admin2: 'Availability & Payment - Check venue availability and manage payments',
  admin3: 'Final Approval - Complete final review and approve bookings',
  super_admin: 'SuperAdmin - Full access to all features and admin management',
};

export const documentTypes = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
  { value: 'other', label: 'Other ID' },
] as const;
