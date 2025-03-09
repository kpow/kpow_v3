import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

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
      const response = await fetch(
        `https://ws.audioscrobbler.com/2.0/?method=artist.gettopalbums&artist=${encodeURIComponent(
          artist
        )}&api_key=${import.meta.env.VITE_LASTFM_API_KEY}&format=json`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch albums");
      }
      return response.json();
    },
    enabled: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artist) {
      toast({
        title: "Error",
        description: "Please enter an artist name",
        variant: "destructive",
      });
      return;
    }
    refetch();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Last.fm Album Lookup</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <Input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Enter artist name"
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Loading..." : "Search"}
          </Button>
        </form>

        {error ? (
          <div className="text-red-500">Error fetching albums</div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data?.topalbums?.album ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.topalbums.album.map((album) => (
              <Card key={album.url}>
                <CardContent className="pt-4">
                  <div className="aspect-square mb-2">
                    <img
                      src={album.image.find((img) => img.size === "large")?.["#text"]}
                      alt={album.name}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <h3 className="font-bold truncate">{album.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Playcount: {album.playcount}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
