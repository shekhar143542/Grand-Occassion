export type AdminRole = 'admin1' | 'admin2' | 'super_admin';

export type BookingStatus = 
  | 'pending' 
  | 'document_review' 
  | 'availability_check' 
  | 'payment_pending' 
  | 'final_approval' 
  | 'approved' 
  | 'change_requested' 
  | 'rejected';

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
  created_at: string;
  updated_at: string;
  halls?: BanquetHall[];
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
  pending: 'Pending Review',
  document_review: 'Document Review',
  availability_check: 'Checking Availability',
  payment_pending: 'Payment Required',
  final_approval: 'Final Approval',
  approved: 'Approved',
  change_requested: 'Changes Requested',
  rejected: 'Rejected',
};

export const statusColors: Record<BookingStatus, string> = {
  pending: 'status-pending',
  document_review: 'status-review',
  availability_check: 'status-review',
  payment_pending: 'status-pending',
  final_approval: 'status-review',
  approved: 'status-approved',
  change_requested: 'status-pending',
  rejected: 'status-rejected',
};
