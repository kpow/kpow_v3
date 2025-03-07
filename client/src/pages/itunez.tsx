import { TopArtistsSlider } from "@/components/top-artists-slider";
import { Card } from "@/components/ui/card";

export default function ITunezPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold">Top Artists</h1>
      </div>
      
      <Card className="p-6">
        <TopArtistsSlider />
      </Card>
    </div>
  );
}
