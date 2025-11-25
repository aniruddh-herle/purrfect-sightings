import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from './use-toast';

export interface CatFeatures {
  breed?: string;
  colors?: string[];
  patterns?: string[];
  [key: string]: unknown;
}

export interface Cat {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  ai_features?: CatFeatures;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CatSighting {
  id: string;
  cat_id: string;
  latitude: number;
  longitude: number;
  spotted_by: string;
  spotted_at: string;
  notes?: string;
  cats?: Cat;
}

export interface CatIdentificationResult {
  existing_cat?: Cat;
  is_likely_same_cat?: boolean;
  match_score?: number;
  features?: CatFeatures;
  error?: string;
  details?: string;
}

export const useCats = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [catSightings, setCatSightings] = useState<CatSighting[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCats = async () => {
    try {
      const { data, error } = await supabase
        .from('cats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCats((data || []) as Cat[]);
    } catch (error) {
      console.error('Error fetching cats:', error);
      toast({
        title: "Error",
        description: "Failed to load cats",
        variant: "destructive",
      });
    }
  };

  const fetchCatSightings = async () => {
    try {
      const { data, error } = await supabase
        .from('cat_sightings')
        .select(`
          *,
          cats (*)
        `)
        .order('spotted_at', { ascending: false });

      if (error) throw error;
      setCatSightings((data || []) as CatSighting[]);
    } catch (error) {
      console.error('Error fetching cat sightings:', error);
      toast({
        title: "Error",
        description: "Failed to load cat sightings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const identifyCat = async (imageBase64: string, latitude: number, longitude: number): Promise<CatIdentificationResult | null> => {
    console.log('=== CALLING identify-cat EDGE FUNCTION ===');
    console.log('Image base64 size:', imageBase64?.length || 0, 'characters');
    console.log('Location:', { latitude, longitude });
    
    try {
      const payload = { imageBase64, latitude, longitude };
      console.log('Payload prepared, invoking function...');
      
      const { data, error } = await supabase.functions.invoke('identify-cat', {
        body: payload
      });

      if (error) {
        console.error('=== SUPABASE FUNCTION ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('=== FUNCTION RESPONSE SUCCESS ===');
      console.log('Response data:', data);
      
      return data as CatIdentificationResult;
    } catch (error) {
      console.error('=== NETWORK OR INVOKE ERROR ===');
      console.error('Error type:', error?.constructor?.name);
      console.error('Error message:', error?.message || error);
      console.error('Full error:', error);
      
      toast({
        title: "Error Identifying Cat",
        description: error?.message || "Failed to connect to cat identification service",
        variant: "destructive",
      });
      return null;
    }
  };

  const uploadCatImage = async (file: File, catId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${catId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('cat-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('cat-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    }
  };

  const createCat = async (name: string, imageFile: File, features: CatFeatures, latitude: number, longitude: number) => {
    if (!user) throw new Error('User not authenticated');

    try {
      // First create the cat record
      const { data: catData, error: catError } = await supabase
        .from('cats')
        .insert({
          name,
          ai_features: features as any,
          created_by: user.id
        })
        .select()
        .single();

      if (catError) throw catError;

      // Upload the image
      const imageUrl = await uploadCatImage(imageFile, catData.id);
      
      if (imageUrl) {
        // Update cat with image URL
        const { error: updateError } = await supabase
          .from('cats')
          .update({ image_url: imageUrl })
          .eq('id', catData.id);

        if (updateError) throw updateError;
      }

      // Create the sighting
      const { error: sightingError } = await supabase
        .from('cat_sightings')
        .insert({
          cat_id: catData.id,
          latitude,
          longitude,
          spotted_by: user.id
        });

      if (sightingError) throw sightingError;

      // Refresh data
      fetchCats();
      fetchCatSightings();

      toast({
        title: "Cat Added Successfully! 🐱",
        description: `${name} has been spotted and added to the map.`,
        variant: "default",
      });

      return catData;
    } catch (error) {
      console.error('Error creating cat:', error);
      toast({
        title: "Error",
        description: "Failed to create cat profile",
        variant: "destructive",
      });
      throw error;
    }
  };

  const addSighting = async (catId: string, latitude: number, longitude: number, notes?: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('cat_sightings')
        .insert({
          cat_id: catId,
          latitude,
          longitude,
          spotted_by: user.id,
          notes
        });

      if (error) throw error;

      fetchCatSightings();

      toast({
        title: "Sighting added! 📍",
        description: "Cat location has been updated successfully.",
      });
    } catch (error) {
      console.error('Error adding sighting:', error);
      toast({
        title: "Error",
        description: "Failed to add sighting",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchCats();
    fetchCatSightings();
  }, []);

  return {
    cats,
    catSightings,
    loading,
    identifyCat,
    createCat,
    addSighting,
    uploadCatImage,
    refreshData: () => {
      fetchCats();
      fetchCatSightings();
    }
  };
};