import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea, ScrollList, ScrollListItem } from "@/components/ui/scroll-area";
import { ArtistAutocomplete } from "@/components/ArtistAutocomplete";

interface Album {
  name: string;
  playcount: number;
  url: string;
  image: Array<{
    "#text": string;
    size: string;
  }>;
}

interface LastFmResponse {
  topalbums: {
    album: Album[];
  };
}

export function AlbumLookup() {
  const [artist, setArtist] = useState("");
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery<LastFmResponse>({
    queryKey: ["albums", artist],
    queryFn: async () => {
      if (!artist) return null;

      const response = await fetch(`/api/lastfm/artist-albums?artist=${encodeURIComponent(artist)}`);
      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error:", errorData);
        throw new Error(`Failed to fetch albums: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`API Error: ${data.message}`);
      }

      return data;
    },
    enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist) {
      toast({
        title: "Error",
        description: "Please select an artist",
        variant: "destructive",
      });
      return;
    }

    refetch();
  };

  return (
    <>
       <h2 className="text-xl font-semibold">Last.fm Album Lookup</h2>
    <Card className="w-full">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mt-10">
          <ArtistAutocomplete 
            onArtistSelect={(selectedArtist) => {
              setArtist(selectedArtist.name);
            }} 
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : "Search Albums"}
          </Button>
        </form>

        {error ? (
          <div className="text-red-500 mt-4">
            {error instanceof Error ? error.message : "Error fetching albums"}
          </div>
        ) : isLoading ? (
          <div className="space-y-2 mt-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data?.topalbums?.album ? (
          <ScrollArea className="h-[500px] mt-4">
            <ScrollList>
              {data.topalbums.album.map((album) => (
                <ScrollListItem 
                  key={album.url}
                  className="items-center" 
                  onClick={() => {
                    navigator.clipboard.writeText(album.name);
                    toast({
                      title: "Copied to clipboard",
                      description: `Album: ${album.name}`,
                      duration: 2000,
                    });
                  }}
                >
                  <div className="h-[60px] w-[60px] mr-3 flex-shrink-0">
                    <img
                      src={album.image.find((img) => img.size === "medium")?.["#text"] || ""}
                      alt={album.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{album.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Playcount: {album.playcount}
                    </p>
                  </div>
                </ScrollListItem>
              ))}
            </ScrollList>
          </ScrollArea>
        ) : null}
      </CardContent>
    </Card>
    </>
  );
}