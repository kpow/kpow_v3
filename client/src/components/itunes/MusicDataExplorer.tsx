import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PlayDataTable } from "./PlayDataTable";
import { ArtistDataTable } from "./ArtistDataTable";
import { SongDataTable } from "./SongDataTable";
import { type Artist } from "@/types/artist";

interface MusicDataExplorerProps {
  onArtistClick: (artist: Artist) => void;
}

export function MusicDataExplorer({ onArtistClick }: MusicDataExplorerProps) {
  const [activeTab, setActiveTab] = useState("plays");

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Music Data Explorer</h2>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="plays">All Plays</TabsTrigger>
          <TabsTrigger value="artists">All Artists</TabsTrigger>
          <TabsTrigger value="songs">All Songs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="plays" className="space-y-4">
          <PlayDataTable onArtistClick={onArtistClick} />
        </TabsContent>
        
        <TabsContent value="artists" className="space-y-4">
          <ArtistDataTable onArtistClick={onArtistClick} />
        </TabsContent>
        
        <TabsContent value="songs" className="space-y-4">
          <SongDataTable onArtistClick={onArtistClick} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
