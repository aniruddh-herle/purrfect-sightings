import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, latitude, longitude } = await req.json();
    
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Analyzing cat image with OpenAI Vision API...');

    // Use OpenAI Vision API to extract cat features
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this cat image and extract identifying features. Return a JSON object with these fields:
                - breed: estimated breed
                - colors: array of primary colors
                - patterns: array of patterns (solid, tabby, calico, etc.)
                - distinctive_features: array of unique features (white paws, facial markings, etc.)
                - estimated_age: young/adult/senior
                - size: small/medium/large
                - similarity_score: a number from 0-100 indicating how distinctive/identifiable this cat is

                Only return the JSON object, no other text.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResult = await response.json();
    let features;
    
    try {
      features = JSON.parse(aiResult.choices[0].message.content);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResult.choices[0].message.content);
      // Fallback features if parsing fails
      features = {
        breed: 'domestic_shorthair',
        colors: ['unknown'],
        patterns: ['solid'],
        distinctive_features: [],
        estimated_age: 'adult',
        size: 'medium',
        similarity_score: 50
      };
    }

    console.log('Extracted features:', features);

    // Search for similar cats in the database
    const { data: existingCats, error: searchError } = await supabase
      .from('cats')
      .select('*')
      .order('created_at', { ascending: false });

    if (searchError) {
      console.error('Error searching cats:', searchError);
      throw searchError;
    }

    console.log(`Found ${existingCats?.length || 0} existing cats to compare`);

    // Find potential matches using AI features
    let bestMatch = null;
    let bestMatchScore = 0;

    if (existingCats && existingCats.length > 0) {
      for (const existingCat of existingCats) {
        if (!existingCat.ai_features) continue;
        
        const existingFeatures = existingCat.ai_features;
        let matchScore = 0;

        // Compare features and calculate similarity score
        if (existingFeatures.breed === features.breed) matchScore += 20;
        
        // Color matching
        const colorMatches = features.colors.filter((color: string) => 
          existingFeatures.colors?.includes(color)
        ).length;
        matchScore += (colorMatches / Math.max(features.colors.length, 1)) * 25;

        // Pattern matching
        const patternMatches = features.patterns.filter((pattern: string) => 
          existingFeatures.patterns?.includes(pattern)
        ).length;
        matchScore += (patternMatches / Math.max(features.patterns.length, 1)) * 25;

        // Distinctive features matching
        const featureMatches = features.distinctive_features.filter((feature: string) => 
          existingFeatures.distinctive_features?.includes(feature)
        ).length;
        matchScore += (featureMatches / Math.max(features.distinctive_features.length, 1)) * 30;

        console.log(`Cat ${existingCat.name}: match score ${matchScore}`);

        if (matchScore > bestMatchScore && matchScore >= 70) {
          bestMatch = existingCat;
          bestMatchScore = matchScore;
        }
      }
    }

    console.log(`Best match: ${bestMatch?.name || 'none'} (score: ${bestMatchScore})`);

    return new Response(JSON.stringify({
      features,
      existing_cat: bestMatch,
      match_score: bestMatchScore,
      is_likely_same_cat: bestMatchScore >= 70
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in identify-cat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An unexpected error occurred',
      features: null,
      existing_cat: null,
      match_score: 0,
      is_likely_same_cat: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});