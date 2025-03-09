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
import artistsData from '../../../artists_without_images.json'

interface Artist {
  id: number
  name: string
  albumName: string
}

interface ArtistAutocompleteProps {
  onArtistSelect: (artist: Artist) => void
}

export function ArtistAutocomplete({ onArtistSelect }: ArtistAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")

  const artists: Artist[] = artistsData

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? artists.find((artist) => artist.name === value)?.name
            : "Select artist..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search artist..." />
          <CommandEmpty>No artist found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-y-auto">
            {artists.map((artist) => (
              <CommandItem
                key={artist.id}
                value={artist.name}
                onSelect={(currentValue) => {
                  setValue(currentValue)
                  onArtistSelect(artist)
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
  )
}
