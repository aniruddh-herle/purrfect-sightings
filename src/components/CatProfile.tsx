import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Shuffle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface CatProfileProps {
  onSave: (name: string, image: string) => void;
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
  const [catImage, setCatImage] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState(false);

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
      setCatImage(placeholderImage);
      toast({
        title: "Photo captured!",
        description: "Great shot of your feline friend."
      });
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCatImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!catName.trim()) {
      toast({
        title: "Name required",
        description: "Please give this cat a name!",
        variant: "destructive"
      });
      return;
    }
    
    if (!catImage) {
      toast({
        title: "Photo required",
        description: "Please add a photo of the cat.",
        variant: "destructive"
      });
      return;
    }

    onSave(catName, catImage);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-warm">
        <CardHeader>
          <CardTitle className="text-center">New Cat Spotted! 🐱</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Photo section */}
          <div className="space-y-3">
            <Label>Cat Photo</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleImageCapture}
                disabled={isCapturing}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                {isCapturing ? "Capturing..." : "Take Photo"}
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </Button>
            </div>
            {catImage && (
              <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
                <img 
                  src={catImage} 
                  alt="Cat preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Name section */}
          <div className="space-y-3">
            <Label htmlFor="catName">Cat Name</Label>
            <div className="flex gap-2">
              <Input
                id="catName"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="Enter a name for this cat"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={generateRandomName}
                title="Generate random name"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button variant="hero" onClick={handleSave} className="flex-1">
              Save Cat
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};