import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, MapPin, AlertCircle, CheckCircle2, Shuffle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useCats, CatIdentificationResult } from "@/hooks/useCats";

interface CatProfileProps {
  onSave: () => void;
  onCancel: () => void;
  location: { lat: number; lng: number };
}

const catNames = [
  "Whiskers", "Mittens", "Shadow", "Luna", "Tiger", "Smokey", "Ginger", "Patches",
  "Oreo", "Simba", "Nala", "Felix", "Garfield", "Misty", "Boots", "Pepper",
  "Snowball", "Midnight", "Rusty", "Cleo", "Max", "Bella", "Oliver", "Chloe"
];

export const CatProfile = ({ onSave, onCancel, location }: CatProfileProps) => {
  const [catName, setCatName] = useState("");
  const [catImage, setCatImage] = useState<File | null>(null);
  const [catImagePreview, setCatImagePreview] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResult, setAiResult] = useState<CatIdentificationResult | null>(null);
  const [showExistingCat, setShowExistingCat] = useState(false);
  
  const { identifyCat, createCat, addSighting } = useCats();

  const generateRandomName = () => {
    const randomName = catNames[Math.floor(Math.random() * catNames.length)];
    setCatName(randomName);
  };

  const handleImageCapture = async () => {
    setIsCapturing(true);
    try {
      // In a real app, this would use the device camera
      // For demo, we'll simulate with a placeholder
      const placeholderImage = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400";
      
      // Convert to File object for consistency
      const response = await fetch(placeholderImage);
      const blob = await response.blob();
      const file = new File([blob], "captured-cat.jpg", { type: "image/jpeg" });
      
      setCatImage(file);
      setCatImagePreview(placeholderImage);
      
      toast({
        title: "Photo captured!",
        description: "Great shot of your feline friend."
      });
      
      // Analyze the captured image
      await analyzeImage(file);
    } catch (error) {
      toast({
        title: "Camera error",
        description: "Unable to access camera. Please try uploading an image instead.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCatImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCatImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      // Analyze the image with AI
      await analyzeImage(file);
    }
  };

  const analyzeImage = async (file: File) => {
    console.log('=== STARTING CAT IMAGE ANALYSIS ===');
    console.log('File name:', file.name);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);
    
    setIsAnalyzing(true);
    setAiResult(null);
    
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
          
          console.log('Image converted to base64, length:', base64Data?.length || 0);
          console.log('Calling identifyCat with location:', location);
          
          const result = await identifyCat(base64Data, location.lat, location.lng);
          
          console.log('=== RECEIVED AI RESULT ===');
          console.log('Result:', result);
          
          setAiResult(result);
          
          if (result?.existing_cat && result?.is_likely_same_cat) {
            console.log('Existing cat match found:', result.existing_cat.name, 'Score:', result.match_score);
            setShowExistingCat(true);
            setCatName(result.existing_cat.name);
            toast({
              title: "Cat identified! 🎯",
              description: `This looks like ${result.existing_cat.name} (${Math.round(result.match_score || 0)}% match)`,
            });
          } else if (result?.features) {
            console.log('New cat detected with features:', result.features);
            toast({
              title: "New cat detected! 🆕",
              description: "This appears to be a new cat. Please give it a name.",
            });
          } else if (result?.error) {
            console.error('AI returned error:', result.error, result.details);
            toast({
              title: "Analysis Error",
              description: result.details || "Failed to analyze cat image",
              variant: "destructive",
            });
          }
        } catch (innerError) {
          console.error('Error in reader.onload handler:', innerError);
          toast({
            title: "Analysis Error",
            description: "Failed to process image data",
            variant: "destructive",
          });
        } finally {
          setIsAnalyzing(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        toast({
          title: "File Read Error",
          description: "Failed to read image file",
          variant: "destructive",
        });
        setIsAnalyzing(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('=== ERROR IN ANALYZE IMAGE ===');
      console.error('Error:', error);
      setIsAnalyzing(false);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze cat image",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    if (!catName.trim()) {
      toast({
        title: "Name required",
        description: "Please give this cat a name",
        variant: "destructive",
      });
      return;
    }

    if (!catImage) {
      toast({
        title: "Photo required",
        description: "Please take or upload a photo of the cat",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (showExistingCat && aiResult?.existing_cat) {
        // Add new sighting for existing cat
        await addSighting(aiResult.existing_cat.id, location.lat, location.lng);
      } else {
        // Create new cat
        await createCat(catName, catImage, aiResult?.features || {}, location.lat, location.lng);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving cat:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAsNewCat = () => {
    setShowExistingCat(false);
    setCatName("");
    toast({
      title: "Creating new cat profile",
      description: "Please give this cat a unique name",
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-warm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-center">
            <MapPin className="w-5 h-5" />
            New Cat Spotted! 🐱
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Photo capture/upload section */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              {catImagePreview ? (
                <div className="space-y-4">
                  <img 
                    src={catImagePreview} 
                    alt="Cat preview" 
                    className="w-full h-48 object-cover rounded-md"
                  />
                  
                  {/* AI Analysis Results */}
                  {isAnalyzing && (
                    <div className="bg-muted p-3 rounded-md">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                        Analyzing cat features with AI...
                      </div>
                    </div>
                  )}
                  
                  {aiResult && !isAnalyzing && (
                    <div className="bg-muted p-3 rounded-md text-left text-sm">
                      {showExistingCat ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">Possible Match Found!</span>
                          </div>
                          <p>This cat looks like <strong>{aiResult.existing_cat.name}</strong> ({Math.round(aiResult.match_score)}% similarity)</p>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={handleAddAsNewCat}>
                              No, this is a new cat
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="font-medium">New Cat Detected</span>
                          </div>
                          <p>This appears to be a new cat. Features detected:</p>
                          <ul className="text-xs space-y-1 ml-4">
                            <li>• Breed: {aiResult.features?.breed || 'Unknown'}</li>
                            <li>• Colors: {aiResult.features?.colors?.join(', ') || 'Unknown'}</li>
                            <li>• Patterns: {aiResult.features?.patterns?.join(', ') || 'Unknown'}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImageCapture}
                      disabled={isCapturing}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {isCapturing ? "Capturing..." : "Retake"}
                    </Button>
                    <Label htmlFor="image-upload">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Different
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-muted-foreground">
                    <Camera className="w-12 h-12 mx-auto mb-2" />
                    <p>Capture or upload a photo of the cat</p>
                    <p className="text-xs mt-1">AI will analyze the image to identify if this cat already exists</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={handleImageCapture}
                      disabled={isCapturing}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {isCapturing ? "Capturing..." : "Take Photo"}
                    </Button>
                    <Label htmlFor="image-upload">
                      <Button
                        variant="outline"
                        asChild
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Photo
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Name input section */}
            <div className="space-y-2">
              <Label htmlFor="cat-name">Cat Name</Label>
              <div className="flex gap-2">
                <Input
                  id="cat-name"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder={showExistingCat ? "Name will be set automatically" : "Enter a name for this cat"}
                  disabled={showExistingCat}
                />
                {!showExistingCat && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={generateRandomName}
                    title="Generate random name"
                  >
                    <Shuffle className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="flex-1"
                disabled={isSubmitting || isAnalyzing}
              >
                {isSubmitting ? (
                  showExistingCat ? "Adding New Sighting..." : "Creating Cat Profile..."
                ) : (
                  showExistingCat ? "Add New Sighting" : "Save Cat"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};