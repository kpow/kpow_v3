import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  flexRender,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { type Artist } from "@/types/artist";

interface ArtistStats extends Artist {
  totalPlays: number;
  uniqueSongs: number;
  firstPlayed: string;
  lastPlayed: string;
}

interface ArtistDataTableProps {
  onArtistClick: (artist: Artist) => void;
}

export function ArtistDataTable({ onArtistClick }: ArtistDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/music/artists", page, sorting],
    queryFn: async () => {
      const response = await fetch(`/api/music/artists?page=${page}&sortBy=${sorting[0]?.id || ''}&sortOrder=${sorting[0]?.desc ? 'desc' : 'asc'}`);
      if (!response.ok) throw new Error("Failed to fetch artist data");
      return response.json() as Promise<{
        data: ArtistStats[];
        totalPages: number;
      }>;
    },
  });

  const columns = [
    {
      accessorKey: "image",
      header: "",
      cell: ({ row }) => (
        <Avatar className="w-8 h-8">
          <img 
            src={row.original.image || "/default-artist.png"} 
            alt={row.original.name}
            className="object-cover"
          />
        </Avatar>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Artist
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <Button 
          variant="link" 
          className="p-0 h-auto"
          onClick={() => onArtistClick(row.original)}
        >
          {row.original.name}
        </Button>
      ),
    },
    {
      accessorKey: "totalPlays",
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Plays
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "uniqueSongs",
      header: "Unique Songs",
    },
    {
      accessorKey: "firstPlayed",
      header: "First Played",
      cell: ({ row }) => new Date(row.original.firstPlayed).toLocaleDateString(),
    },
    {
      accessorKey: "lastPlayed",
      header: "Last Played",
      cell: ({ row }) => new Date(row.original.lastPlayed).toLocaleDateString(),
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="p-2">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-2 py-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-2 py-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((old) => Math.max(old - 1, 1))}
          disabled={page === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((old) => old + 1)}
          disabled={!data || page === data.totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
