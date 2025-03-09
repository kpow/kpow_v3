import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface PendingUser {
  id: number;
  username: string;
  createdAt: string;
}

const searchFormSchema = z.object({
  artistName: z.string().min(1, "Artist name is required"),
  albumName: z.string().min(1, "Album name is required").optional(),
});

export default function AdminPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchResults, setSearchResults] = useState<any>(null);
  const [lastFmAlbums, setLastFmAlbums] = useState<any>(null);

  const searchForm = useForm<z.infer<typeof searchFormSchema>>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      artistName: "",
      albumName: "",
    },
  });

  const { data: pendingUsers, isLoading } = useQuery<PendingUser[]>({
    queryKey: ["/api/admin/pending-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/pending-users");
      if (!res.ok) throw new Error("Failed to fetch pending users");
      return res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await fetch("/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error("Failed to approve user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      toast({
        title: "User approved",
        description: "The user can now log in to their account.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to approve user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateArtistImage = useMutation({
    mutationFn: async ({ artistName, imageUrl }: { artistName: string; imageUrl: string }) => {
      const res = await fetch("/api/admin/update-artist-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistName, imageUrl }),
      });
      if (!res.ok) throw new Error("Failed to update artist image");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Artist updated",
        description: "The artist's image URL has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  async function onSearchArtist(values: z.infer<typeof searchFormSchema>) {
    try {
      const response = await fetch(
        `/api/lastfm/artist-albums/${encodeURIComponent(values.artistName)}`
      );
      if (!response.ok) throw new Error("Artist search failed");
      const data = await response.json();
      setLastFmAlbums(data);
      // Clear previous iTunes results
      setSearchResults(null);
    } catch (error) {
      toast({
        title: "Artist search failed",
        description: error instanceof Error ? error.message : "Failed to search artist",
        variant: "destructive",
      });
    }
  }

  async function onSearchItunes(albumName: string) {
    try {
      const response = await fetch(
        `/api/admin/search-itunes?term=${encodeURIComponent(albumName)}`
      );
      if (!response.ok) throw new Error("iTunes search failed");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Failed to search iTunes",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* User Approval Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Pending Users</h2>
        {pendingUsers?.length === 0 ? (
          <p className="text-muted-foreground">No pending users to approve.</p>
        ) : (
          <div className="grid gap-4">
            {pendingUsers?.map((user) => (
              <Card key={user.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      Registered on: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => approveMutation.mutate(user.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      "Approve"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Artist Search and Image Update Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Artist Image Update</h2>
        <Card>
          <CardContent className="p-4">
            <Form {...searchForm}>
              <form onSubmit={searchForm.handleSubmit(onSearchArtist)} className="space-y-4">
                <FormField
                  control={searchForm.control}
                  name="artistName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Artist</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter artist name..." {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={searchForm.formState.isSubmitting}>
                  {searchForm.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching Artist...
                    </>
                  ) : (
                    "Search Last.fm"
                  )}
                </Button>
              </form>
            </Form>

            {lastFmAlbums && (
              <div className="mt-6 space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Artist Albums from Last.fm</h3>
                  <div className="grid gap-4">
                    {lastFmAlbums.albums?.map((album: any, index: number) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={album.image}
                              alt={album.name}
                              className="w-20 h-20 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{album.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Playcount: {album.playcount}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => onSearchItunes(`${album.artist} ${album.name}`)}
                            >
                              Search on iTunes
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {searchResults && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-2">iTunes Results</h3>
                    <div className="grid gap-4">
                      {searchResults.results?.map((result: any, index: number) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={result.artworkUrl100}
                                alt={result.collectionName}
                                className="w-20 h-20 object-cover rounded"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{result.artistName}</p>
                                <p className="text-sm text-muted-foreground">{result.collectionName}</p>
                              </div>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  searchForm.setValue("artistName", result.artistName);
                                  searchForm.setValue("imageUrl", result.artworkUrl100.replace('100x100', '600x600'));
                                }}
                              >
                                Use This Artist
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="mt-4 space-y-4">
                      <h3 className="text-lg font-medium">Update Artist Image</h3>
                      <div className="flex gap-4">
                        <Input
                          placeholder="Artist name..."
                          className="flex-1"
                          onChange={(e) => searchForm.setValue("artistName", e.target.value)}
                        />
                        <Input
                          placeholder="Image URL..."
                          className="flex-2"
                          onChange={(e) => searchForm.setValue("imageUrl", e.target.value)}
                        />
                        <Button
                          onClick={() =>
                            updateArtistImage.mutate({
                              artistName: searchForm.getValues("artistName"),
                              imageUrl: searchForm.getValues("imageUrl"),
                            })
                          }
                          disabled={updateArtistImage.isPending}
                        >
                          {updateArtistImage.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            "Update Artist"
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium mb-2">Raw Response</h3>
                      <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto">
                        {JSON.stringify(searchResults, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}