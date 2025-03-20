import { useState } from "react";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";

const searchFormSchema = z.object({
  albumName: z.string().min(1, "Album name is required"),
  artistName: z.string().optional(),
  imageUrl: z.string().optional(),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

export function ITunesSearch() {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<any>(null);

  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      albumName: "",
      artistName: "",
      imageUrl: "",
    },
  });

  const updateArtistImage = useMutation({
    mutationFn: async ({
      artistName,
      imageUrl,
    }: {
      artistName: string;
      imageUrl: string;
    }) => {
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

  const onSearchSubmit = async (values: SearchFormValues) => {
    try {
      const response = await fetch(
        `/api/admin/search-itunes?term=${encodeURIComponent(values.albumName)}`,
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search failed",
        description:
          error instanceof Error ? error.message : "Failed to search iTunes",
        variant: "destructive",
      });
    }
  };

  const handleUseArtwork = (result: any) => {
    // Extract the largest available artwork URL
    const artworkUrl = result.artworkUrl100.replace('100x100', '600x600');
    searchForm.setValue("artistName", result.artistName);
    searchForm.setValue("imageUrl", artworkUrl);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Artist Image Update</h2>
      <Card>
        <CardContent className="p-4">
          <Form {...searchForm}>
            <form
              onSubmit={searchForm.handleSubmit(onSearchSubmit)}
              className="space-y-4"
            >
              <FormField
                control={searchForm.control}
                name="albumName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Search Album</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter album name..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={searchForm.formState.isSubmitting}
              >
                {searchForm.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search iTunes"
                )}
              </Button>
            </form>
          </Form>

          {searchResults && (
            <div className="mt-4 space-y-6">
              <div className="mt-4 space-y-4">
                <div className="flex gap-4">
                  <Input
                    placeholder="Image URL..."
                    value={searchForm.watch("imageUrl")}
                    onChange={(e) =>
                      searchForm.setValue("imageUrl", e.target.value)
                    }
                  />
                  <Input
                    placeholder="Artist name..."
                    value={searchForm.watch("artistName")}
                    onChange={(e) =>
                      searchForm.setValue("artistName", e.target.value)
                    }
                  />
                  <Button
                    onClick={() =>
                      updateArtistImage.mutate({
                        artistName: searchForm.getValues("artistName") || "",
                        imageUrl: searchForm.getValues("imageUrl") || "",
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
              <div>
                <h3 className="text-lg font-medium mb-2">Search Results</h3>
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
                            <p className="text-sm text-muted-foreground">
                              {result.collectionName}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => handleUseArtwork(result)}
                          >
                            Use Artwork
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}