-- Create storage bucket for venue images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('venue-images', 'venue-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view venue images (public bucket)
CREATE POLICY "Anyone can view venue images"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-images');

-- Allow admins to upload venue images
CREATE POLICY "Admins can upload venue images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'venue-images' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to update venue images
CREATE POLICY "Admins can update venue images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'venue-images' 
  AND public.is_admin(auth.uid())
);

-- Allow admins to delete venue images
CREATE POLICY "Admins can delete venue images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'venue-images' 
  AND public.is_admin(auth.uid())
);