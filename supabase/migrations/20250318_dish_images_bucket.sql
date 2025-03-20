-- Create a new storage bucket for dish images
INSERT INTO storage.buckets (id, name, public)
VALUES ('dish_images', 'dish_images', true);
COMMENT ON TABLE storage.buckets IS 'Storage buckets for storing files like dish images';

INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_avatars', 'profile_avatars', true);
COMMENT ON TABLE storage.buckets IS 'Storage buckets for storing profiles avatars';

-- Add image_url column to the dishes table
ALTER TABLE public.dishes 
ADD COLUMN image_url VARCHAR;

ALTER TABLE public.profiles 
ADD COLUMN avatar_url VARCHAR;

-- Set up access policies for the dish images bucket

-- Allow anyone to view dish images (since these will be displayed publicly)
CREATE POLICY "Public users can view dish images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dish_images');

-- Only authenticated users can upload dish images
CREATE POLICY "Authenticated users can upload dish images" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
  bucket_id = 'dish_images'
);

-- Users can only update or delete their own dish images
-- Check if the user is the owner of the dish based on the path pattern
-- The path pattern should be: {user_id}/{dish_id}/file.jpg
CREATE POLICY "Users can update their own dish images" 
ON storage.objects FOR UPDATE
TO authenticated 
USING (
  bucket_id = 'dish_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own dish images" 
ON storage.objects FOR DELETE
TO authenticated 
USING (
  bucket_id = 'dish_images' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all dish images
CREATE POLICY "Admins can manage all dish images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'dish_images' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Allow public reading of profile avatars
CREATE POLICY "Profile avatars are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile_avatars');

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profile_avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile_avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile_avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);