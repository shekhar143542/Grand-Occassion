-- Create enum for user roles
CREATE TYPE public.admin_role AS ENUM ('admin1', 'admin2', 'super_admin');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('pending', 'document_review', 'availability_check', 'payment_pending', 'final_approval', 'approved', 'change_requested', 'rejected');

-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create user_roles table for admin roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role admin_role NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Create banquet_halls table
CREATE TABLE public.banquet_halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  price_per_hour DECIMAL(10,2) NOT NULL,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  panorama_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  total_amount DECIMAL(10,2),
  notes TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  event_type TEXT,
  guest_count INTEGER,
  special_requests TEXT,
  admin1_notes TEXT,
  admin2_notes TEXT,
  super_admin_notes TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create booking_halls junction table for multiple halls per booking
CREATE TABLE public.booking_halls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  hall_id UUID REFERENCES public.banquet_halls(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (booking_id, hall_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banquet_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_halls ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role admin_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Check if user is any admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- User roles policies
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin2 can create admin1" ON public.user_roles
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'admin2') AND role = 'admin1'
  );

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Banquet halls policies (public read, admin write)
CREATE POLICY "Anyone can view active halls" ON public.banquet_halls
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage halls" ON public.banquet_halls
  FOR ALL USING (public.is_admin(auth.uid()));

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'change_requested'));

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update bookings" ON public.bookings
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Booking halls policies
CREATE POLICY "Users can view own booking halls" ON public.booking_halls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_halls.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert booking halls" ON public.booking_halls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE bookings.id = booking_halls.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all booking halls" ON public.booking_halls
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_banquet_halls_updated_at
  BEFORE UPDATE ON public.banquet_halls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample banquet halls with 360 panorama URLs
INSERT INTO public.banquet_halls (name, description, capacity, price_per_hour, amenities, panorama_url, images) VALUES
(
  'The Grand Ballroom',
  'Our flagship venue featuring crystal chandeliers, marble floors, and floor-to-ceiling windows with stunning city views. Perfect for weddings and grand celebrations.',
  500,
  2500.00,
  '["Stage", "Dance Floor", "Bridal Suite", "Valet Parking", "AV Equipment", "Central AC"]',
  'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1920',
  '["https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800", "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800"]'
),
(
  'The Royal Chamber',
  'An intimate space with rich wooden paneling and warm ambient lighting. Ideal for corporate events, cocktail parties, and private dinners.',
  150,
  1200.00,
  '["Private Bar", "Lounge Area", "Projector", "WiFi", "Sound System"]',
  'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=1920',
  '["https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800", "https://images.unsplash.com/photo-1522413452208-996ff3f3e740?w=800"]'
),
(
  'The Garden Pavilion',
  'An enchanting outdoor venue surrounded by manicured gardens and water features. Features a retractable roof for all-weather events.',
  300,
  1800.00,
  '["Outdoor Seating", "Fountain", "Garden Lights", "Heaters", "Tent Cover"]',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920',
  '["https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800", "https://images.unsplash.com/photo-1510076857177-7470076d4098?w=800"]'
),
(
  'The Crystal Suite',
  'A modern and elegant space with contemporary design, LED mood lighting, and state-of-the-art technology for memorable events.',
  200,
  1500.00,
  '["LED Walls", "Modern Decor", "Premium Sound", "Live Streaming", "Green Room"]',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920',
  '["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800", "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800"]'
);