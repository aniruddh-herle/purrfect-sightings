import { OpenStreetMap } from './OpenStreetMap';
import { CatSighting } from "@/hooks/useCats";

interface MapViewProps {
  onAddCat: (lat: number, lng: number) => void;
  catSightings: CatSighting[];
  loading: boolean;
}

export const MapView = ({ onAddCat, catSightings, loading }: MapViewProps) => {
  return (
    <OpenStreetMap 
      onAddCat={onAddCat}
      catSightings={catSightings}
      loading={loading}
    />
  );
};