"use client"

import { Check, ChevronsUpDown, Loader2, RefreshCw } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"

interface Artist {
  id: number
  name: string
  albumName: string | null
}

interface ArtistAutocompleteProps {
  onArtistSelect: (artist: { name: string }) => void
}

export function ArtistAutocomplete({ onArtistSelect }: ArtistAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [inputValue, setInputValue] = React.useState("")
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch artists without images from API
  const { data: artists, isLoading, error, refetch } = useQuery<Artist[]>({
    queryKey: ["artistsWithoutImages"],
    queryFn: async () => {
      const response = await fetch("/api/admin/artists-without-images")
      if (!response.ok) {
        const errorData = await response.text()
        console.error("API Error:", errorData)
        throw new Error(`Failed to fetch artists: ${response.statusText}`)
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes so refresh button is useful
  })
  
  // Refresh artists without images
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Invalidate the query cache and force a refetch
      await queryClient.invalidateQueries({ queryKey: ["artistsWithoutImages"] })
      await refetch()
      
      toast({
        title: "Success",
        description: "Artists without images list has been refreshed",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error refreshing artists",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Show error toast if the query fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Error fetching artists",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }, [error, toast])

  // Filter artists based on input value
  const filteredArtists = React.useMemo(() => {
    if (!artists) return []
    return artists.filter((artist) =>
      artist.name.toLowerCase().includes(inputValue.toLowerCase())
    )
  }, [artists, inputValue])

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-muted-foreground">
          {artists ? `${artists.length} artists without images` : "Loading artists..."}
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing || isLoading}
        >
          {isRefreshing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh List
            </>
          )}
        </Button>
      </div>
      
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
            >
              {value || inputValue || "Select artist..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput 
                placeholder="Search artist..." 
                value={inputValue}
                onValueChange={(search) => {
                  setInputValue(search)
                  // When user types, also update the main value
                  setValue("")
                  onArtistSelect({ name: search })
                }}
              />
              {isLoading ? (
                <div className="py-6 text-center text-sm">
                  <Loader2 className="mb-2 h-4 w-4 animate-spin mx-auto" />
                  Loading artists...
                </div>
              ) : (
                <>
                  <CommandEmpty>No artist found.</CommandEmpty>
                  <CommandGroup className="max-h-[300px] overflow-y-auto">
                    {filteredArtists.map((artist) => (
                      <CommandItem
                        key={artist.id}
                        value={artist.name}
                        onSelect={(currentValue) => {
                          setValue(currentValue)
                          setInputValue(currentValue)
                          onArtistSelect({ name: currentValue })
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === artist.name ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {artist.name}
                        {artist.albumName && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({artist.albumName})
                          </span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}