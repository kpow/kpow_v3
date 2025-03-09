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
          <div className="text-red-500">
            {error instanceof Error ? error.message : "Error fetching albums"}
          </div>
        ) : isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data?.topalbums?.album ? (
          <div className="border rounded-md max-h-[500px] overflow-y-auto">
            <ul className="divide-y">
              {data.topalbums.album.map((album) => (
                <li 
                  key={album.url} 
                  className="p-3 flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
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
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}