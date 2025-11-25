import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapView } from "@/components/MapView";
import { CatProfile } from "@/components/CatProfile";
import { MapPin, Heart, Users, Camera, LogOut } from "lucide-react";
import heroImage from "@/assets/hero-cat.jpg";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCats } from "@/hooks/useCats";

const Index = () => {
  const { user, signOut } = useAuth();
  const { catSightings, loading } = useCats();
  const [showCatProfile, setShowCatProfile] = useState(false);
  const [newCatLocation, setNewCatLocation] = useState<{lat: number, lng: number} | null>(null);
  const [showMap, setShowMap] = useState(false);

  const handleStartSpotting = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start spotting cats",
        variant: "destructive",
      });
      return;
    }
    setShowMap(true);
  };

  const handleAddCat = (lat: number, lng: number) => {
    setNewCatLocation({ lat, lng });
    setShowCatProfile(true);
  };

  const handleSaveCat = () => {
    setShowCatProfile(false);
    setNewCatLocation(null);
  };

  if (showMap) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-screen flex flex-col">
          {/* Header */}
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                  <MapPin className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold">Cat Spotter</h1>
                <span className="text-sm text-muted-foreground">Welcome, {user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowMap(false)}>
                  Back to Home
                </Button>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Map */}
          <div className="flex-1 p-4">
            <MapView 
              onAddCat={handleAddCat}
              catSightings={catSightings}
              loading={loading}
            />
          </div>
        </div>
        
        {/* Cat Profile Modal */}
        {showCatProfile && newCatLocation && (
          <CatProfile
            location={newCatLocation}
            onSave={handleSaveCat}
            onCancel={() => {
              setShowCatProfile(false);
              setNewCatLocation(null);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-accent/80" />
        </div>
        
        <div className="relative z-10 text-center text-primary-foreground px-4 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Spot Every
            <span className="block text-accent-foreground">Cat in the City</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">
            Discover, photograph, and share the feline friends roaming your neighborhood. 
            Build a community of cat lovers, one whisker at a time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="hero" 
              size="xl"
              onClick={handleStartSpotting}
              className="text-lg"
            >
              <Camera className="w-6 h-6 mr-2" />
              Start Spotting
            </Button>
            <Button variant="outline" size="xl" className="text-lg bg-card/10 border-card text-card-foreground hover:bg-card/20">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Cat Spotters Love Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of cat enthusiasts mapping the feline world around them
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center shadow-card bg-gradient-card">
              <CardHeader>
                <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8" />
                </div>
                <CardTitle>Interactive Mapping</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Drop pins on an interactive map to mark exact locations where you've spotted cats. 
                  Build a comprehensive database of neighborhood felines.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-card bg-gradient-card">
              <CardHeader>
                <div className="bg-accent text-accent-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8" />
                </div>
                <CardTitle>Photo & Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Capture beautiful photos and create profiles for each cat. Give them names, 
                  track their habits, and build their story over time.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-card bg-gradient-card">
              <CardHeader>
                <div className="bg-secondary text-secondary-foreground w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <CardTitle>Community Driven</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Connect with fellow cat lovers in your area. Share sightings, 
                  collaborate on cat care, and build a supportive community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">{catSightings.length}</div>
              <div className="text-muted-foreground">Cat Sightings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1.2k+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50+</div>
              <div className="text-muted-foreground">Cities Covered</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2.5k+</div>
              <div className="text-muted-foreground">Photos Shared</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Cat Adventure?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join our growing community of cat spotters and help us map every feline friend in your city.
          </p>
          <Button 
            variant="hero" 
            size="xl"
            onClick={handleStartSpotting}
            className="text-lg"
          >
            <Heart className="w-6 h-6 mr-2" />
            Start Spotting Cats
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
