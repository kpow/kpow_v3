import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { type Artist } from "@/types/artist";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const columnHelper = createColumnHelper<Artist>();

const columns = [
  columnHelper.accessor((row) => ({ name: row.name, imageUrl: row.imageUrl || row.artistImageUrl }), {
    id: "artist",
    header: "Artist",
    cell: (info) => {
      const { name, imageUrl } = info.getValue();
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex-shrink-0">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={name}
                className="h-full w-full object-cover rounded"
              />
            ) : (
              <div className="h-full w-full bg-muted flex items-center justify-center rounded">
                <span className="text-xl">🎵</span>
              </div>
            )}
          </div>
          <span className="font-medium">{name}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("listeners", {
    header: "Listeners",
    cell: (info) => info.getValue()?.toLocaleString() || "N/A",
  }),
  columnHelper.accessor("playcount", {
    header: "Play Count",
    cell: (info) => info.getValue()?.toLocaleString() || "N/A",
  }),
  columnHelper.accessor("lastUpdated", {
    header: "Last Updated",
    cell: (info) => {
      const date = info.getValue();
      return date ? format(new Date(date), "PPP") : "N/A";
    },
  }),
];

interface ArtistDataTableProps {
  onArtistClick?: (artist: Artist) => void;
}

export function ArtistDataTable({ onArtistClick }: ArtistDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["/api/table/artists", pageIndex, pageSize, sorting],
    queryFn: async () => {
      const sortBy = sorting[0]?.id || "id";
      const sortOrder = sorting[0]?.desc ? "desc" : "asc";
      
      const response = await fetch(
        `/api/table/artists?page=${pageIndex + 1}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      if (!response.ok) throw new Error("Failed to fetch artists");
      return response.json();
    },
  });

  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    pageCount: data?.pagination?.totalPages ?? -1,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onArtistClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {data?.pagination?.totalPages || 1}
        </div>
      </div>
    </div>
  );
}
