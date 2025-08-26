-- Create cats table
CREATE TABLE IF NOT EXISTS public.cats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  ai_features JSONB, -- Store AI-extracted features for identification
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cats
ALTER TABLE public.cats ENABLE ROW LEVEL SECURITY;

-- Create policies for cats
CREATE POLICY "Anyone can view cats" 
ON public.cats 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create cats" 
ON public.cats 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own cats" 
ON public.cats 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create cat_sightings table for multiple locations
CREATE TABLE IF NOT EXISTS public.cat_sightings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cat_id UUID NOT NULL REFERENCES public.cats(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  spotted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on cat_sightings
ALTER TABLE public.cat_sightings ENABLE ROW LEVEL SECURITY;

-- Create policies for cat_sightings
CREATE POLICY "Anyone can view cat sightings" 
ON public.cat_sightings 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create sightings" 
ON public.cat_sightings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = spotted_by);

-- Create storage bucket for cat images
INSERT INTO storage.buckets (id, name, public) VALUES ('cat-images', 'cat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for cat image uploads
CREATE POLICY "Anyone can view cat images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'cat-images');

CREATE POLICY "Authenticated users can upload cat images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'cat-images');

CREATE POLICY "Users can update their own cat images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'cat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on cats
CREATE TRIGGER update_cats_updated_at
BEFORE UPDATE ON public.cats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();