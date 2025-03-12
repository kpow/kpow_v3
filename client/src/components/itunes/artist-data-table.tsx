import * as React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { type Artist } from "@/types/artist";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface ArtistDataTableProps {
  onArtistClick?: (artist: Artist) => void;
}

export function ArtistDataTable({ onArtistClick }: ArtistDataTableProps) {
  const columnHelper = createColumnHelper<Artist>();

  const columns = [
    columnHelper.accessor("imageUrl", {
      header: "Image",
      cell: (info) => (
        <div className="w-10 h-10 relative">
          {info.getValue() || info.row.original.artistImageUrl ? (
            <img
              src={info.getValue() || info.row.original.artistImageUrl}
              alt={info.row.original.name}
              className="rounded-full object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-muted rounded-full flex items-center justify-center">
              🎵
            </div>
          )}
        </div>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("listeners", {
      header: "Listeners",
      cell: (info) => info.getValue()?.toLocaleString() || "-",
    }),
    columnHelper.accessor("playcount", {
      header: "Play Count",
      cell: (info) => info.getValue()?.toLocaleString() || "-",
    }),
    columnHelper.accessor("lastUpdated", {
      header: "Last Updated",
      cell: (info) => 
        info.getValue() 
          ? format(new Date(info.getValue() || ''), "PPP")
          : "-",
    }),
    columnHelper.accessor("lastPlayed", {
      header: "Last Played",
      cell: (info) => 
        info.getValue()
          ? format(new Date(info.getValue() || ''), "PPP")
          : "-",
    }),
    columnHelper.accessor("rank", {
      header: "Rank",
      cell: (info) => info.getValue() || "-",
    }),
  ];

  const { data: artistsData, isLoading, error } = useQuery({
    queryKey: ["/api/music/top-artists"], // Updated endpoint
    queryFn: async () => {
      try {
        const response = await fetch("/api/music/top-artists");
        console.log("API Status:", response.status);

        if (!response.ok) {
          throw new Error(`Failed to fetch artists: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("API Response:", data);

        if (!data || !Array.isArray(data.artists)) {
          console.error("Invalid data format:", data);
          throw new Error("Invalid response format: expected {artists: Artist[]}");
        }

        return data;
      } catch (error) {
        console.error("Error fetching artists:", error);
        throw error;
      }
    },
    retry: 1,
  });

  const table = useReactTable({
    data: artistsData?.artists || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        Failed to load artists: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <Card className="p-4">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
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
                onClick={() => onArtistClick?.(row.original)}
                className="cursor-pointer hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                No artists found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}