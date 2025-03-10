import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Song {
  id: number;
  name: string;
  albumName: string | null;
  artistName: string;
}

const ITEMS_PER_PAGE = 200;

export function SongsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSongs, setSelectedSongs] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const { data: songs, isLoading } = useQuery<Song[]>({
    queryKey: ["/api/admin/songs-without-plays"],
    queryFn: async () => {
      const res = await fetch("/api/admin/songs-without-plays");
      if (!res.ok) throw new Error("Failed to fetch songs");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (songIds: number[]) => {
      const res = await fetch("/api/admin/delete-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songIds }),
      });
      if (!res.ok) throw new Error("Failed to delete songs");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/songs-without-plays"] });
      setSelectedSongs(new Set());
      toast({
        title: "Songs deleted",
        description: "Selected songs have been removed from the database.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting songs",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const totalSongs = songs?.length || 0;
  const totalPages = Math.ceil(totalSongs / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentSongs = songs?.slice(startIndex, endIndex) || [];

  const toggleAllSongs = () => {
    if (selectedSongs.size === currentSongs.length) {
      setSelectedSongs(new Set());
    } else {
      const newSelected = new Set(selectedSongs);
      currentSongs.forEach(song => newSelected.add(song.id));
      setSelectedSongs(newSelected);
    }
  };

  const toggleSong = (songId: number) => {
    const newSelected = new Set(selectedSongs);
    if (newSelected.has(songId)) {
      newSelected.delete(songId);
    } else {
      newSelected.add(songId);
    }
    setSelectedSongs(newSelected);
  };

  const handleDelete = () => {
    if (selectedSongs.size === 0) return;
    deleteMutation.mutate(Array.from(selectedSongs));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={currentSongs.length > 0 && selectedSongs.size === currentSongs.length}
              onClick={toggleAllSongs}
            />
            <span>Select All on Page</span>
          </div>
          <Button
            onClick={handleDelete}
            variant="destructive"
            disabled={selectedSongs.size === 0 || deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected ({selectedSongs.size})
              </>
            )}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Total Songs: {totalSongs} | Page {currentPage} of {totalPages}
        </div>
      </div>

      <div className="grid gap-4">
        {currentSongs.length === 0 ? (
          <p className="text-muted-foreground">No songs without plays found.</p>
        ) : (
          currentSongs.map((song) => (
            <Card key={song.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-4">
                  <Checkbox
                    checked={selectedSongs.has(song.id)}
                    onClick={() => toggleSong(song.id)}
                  />
                  <div>
                    <p className="font-medium">{song.name}</p>
                    <p className="text-sm text-muted-foreground">
                      by {song.artistName}
                      {song.albumName && ` • ${song.albumName}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
        >
          Previous
        </Button>
        <span>
          Showing {startIndex + 1}-{Math.min(endIndex, totalSongs)} of {totalSongs}
        </span>
        <Button
          variant="outline"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
        >
          Next
        </Button>
      </div>
    </div>
  );
}