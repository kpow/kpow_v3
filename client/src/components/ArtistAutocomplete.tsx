"use client"

import { Check, ChevronsUpDown } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import artistsData from '@/data/artists_without_images.json'

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

  const artists: Artist[] = artistsData

  // Filter artists based on input value
  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(inputValue.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-2">
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
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}