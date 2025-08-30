# Purrfect Sightings 🐱

A React-based web application that allows users to post sightings of cats they encounter. Users can place pins on a Google Maps interface, upload photos, and either auto-generate names or input custom names for cats. The app uses AI to cross-reference photos with existing cat profiles in the database.

## Features

- 🗺️ **Interactive Google Maps Integration** - Place pins and view cat sightings
- 📸 **Photo Upload & AI Analysis** - Automatically identify if a cat already exists
- 🐱 **Cat Profile Management** - Create and manage cat profiles with sightings
- 🔐 **User Authentication** - Secure sign-in with Supabase
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS
- **Maps**: OpenStreetMap with Leaflet (Free, no API keys required)
- **Backend**: Supabase (Database, Auth, Storage)
- **AI**: Custom Supabase Edge Functions for cat identification
- **State Management**: React Query + React Hooks

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase project (for authentication and database)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd purrfect-sightings
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables** (Optional - only if you need to override Supabase defaults)
   Create a `.env` file in the project root:
   ```bash
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   **Note**: The maps work without any API keys - OpenStreetMap is completely free!

5. **Run the development server**
   ```bash
   npm run dev
   ```

## How It Works

### Cat Sighting Flow

1. **User Authentication**: Sign in with email/password via Supabase
2. **Map Navigation**: Use Google Maps to navigate to locations
3. **Pin Placement**: Click on map to place a pin for a cat sighting
4. **Photo Capture**: Take or upload a photo of the cat
5. **AI Analysis**: Photo is analyzed to detect cat features and check for matches
6. **Profile Creation/Update**: 
   - If cat exists: Add new sighting to existing profile
   - If new cat: Create new profile with generated/input name

### AI Cat Identification

The app uses a Supabase Edge Function (`identify-cat`) that:
- Analyzes uploaded photos for cat features (breed, colors, patterns)
- Compares features with existing cat profiles
- Calculates similarity scores
- Suggests matches or confirms new cats

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── GoogleMap.tsx   # Google Maps integration
│   ├── MapView.tsx     # Map wrapper component
│   ├── CatProfile.tsx  # Cat creation/editing modal
│   └── AuthPage.tsx    # Authentication interface
├── hooks/               # Custom React hooks
│   ├── useAuth.tsx     # Authentication logic
│   ├── useCats.tsx     # Cat data management
│   └── useMobile.tsx   # Mobile detection
├── integrations/        # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                 # Utility functions
│   ├── utils.ts        # General utilities
│   └── google-maps.ts  # Google Maps configuration
└── pages/               # Page components
    ├── Index.tsx        # Main landing page
    └── NotFound.tsx     # 404 page
```

## Database Schema

### Tables

- **`cats`**: Cat profiles with names, images, and AI features
- **`cat_sightings`**: Individual sightings with location and timestamp
- **`users`**: User accounts and authentication

### Relationships

- One cat can have multiple sightings
- Each sighting belongs to one cat and one user
- Users can create multiple cat profiles and sightings

## Customization

### Map Styling
Edit `src/lib/openstreetmap.ts` to customize:
- Map center and zoom level
- Map tile providers and styles
- Default configuration

### UI Components
Modify `src/components/OpenStreetMap.tsx` for:
- Map controls and layout
- Marker appearance and behavior
- User interface elements

## Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables
Ensure these are set in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Note**: No map API keys are required - OpenStreetMap is completely free!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the [SETUP.md](./SETUP.md) for detailed setup instructions
2. Review the Supabase and Google Maps documentation
3. Open an issue in the repository

---

**Happy Cat Spotting! 🐱📍**
