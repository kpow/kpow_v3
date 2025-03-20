import { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  type SortingState,
  type Column,
  createColumnHelper,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const columnHelper = createColumnHelper<Artist>();

// Sortable header component
function SortableHeader({ 
  column, 
  title 
}: { 
  column: Column<Artist, unknown>, 
  title: string 
}) {
  return (
    <div 
      className="flex items-center gap-1 cursor-pointer select-none"
      onClick={() => column.toggleSorting()}
    >
      <span>{title}</span>
      {column.getIsSorted() === "asc" && (
        <ArrowUp className="h-4 w-4 ml-1" />
      )}
      {column.getIsSorted() === "desc" && (
        <ArrowDown className="h-4 w-4 ml-1" />
      )}
      {!column.getIsSorted() && (
        <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
      )}
    </div>
  );
}

const columns = [
  columnHelper.accessor((row) => ({ name: row.name, imageUrl: row.imageUrl || row.artistImageUrl }), {
    id: "artist",
    header: ({ column }) => <SortableHeader column={column} title="Artist" />,
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
    enableSorting: true,
    sortingFn: (rowA, rowB) => 
      rowA.original.name.localeCompare(rowB.original.name),
  }),
  columnHelper.accessor("listeners", {
    header: ({ column }) => <SortableHeader column={column} title="Listeners" />,
    cell: (info) => info.getValue()?.toLocaleString() || "N/A",
    enableSorting: true,
  }),
  columnHelper.accessor("playcount", {
    header: ({ column }) => <SortableHeader column={column} title="Play Count" />,
    cell: (info) => info.getValue()?.toLocaleString() || "N/A",
    enableSorting: true,
  }),
  columnHelper.accessor("lastUpdated", {
    header: ({ column }) => <SortableHeader column={column} title="Last Updated" />,
    cell: (info) => {
      const date = info.getValue();
      return date ? format(new Date(date), "PPP") : "N/A";
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      // Handle null dates
      if (!rowA.original.lastUpdated) return 1;
      if (!rowB.original.lastUpdated) return -1;
      return new Date(rowA.original.lastUpdated).getTime() - 
             new Date(rowB.original.lastUpdated).getTime();
    },
  }),
];

interface ArtistDataTableProps {
  onArtistClick?: (artist: Artist) => void;
  initialPage?: number;
}

export function ArtistDataTable({ onArtistClick, initialPage = 0 }: ArtistDataTableProps) {
  // Default to sorting by artist name ascending
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'artist', desc: false }
  ]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: initialPage,
    pageSize: 10,
  });
  
  const [pageInput, setPageInput] = useState<string>((initialPage + 1).toString());

  // Handle direct page navigation
  const handleGoToPage = () => {
    const totalPages = data?.pagination?.totalPages || 1;
    const parsedPage = parseInt(pageInput, 10);
    
    if (isNaN(parsedPage) || parsedPage < 1 || parsedPage > totalPages) {
      // Reset to current page if invalid
      setPageInput((pageIndex + 1).toString());
      return;
    }
    
    // TanStack Table uses 0-based index for pages
    setPagination({
      pageIndex: parsedPage - 1,
      pageSize,
    });
  };

  // Update page input when page changes
  useEffect(() => {
    setPageInput((pageIndex + 1).toString());
  }, [pageIndex]);

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
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {data?.pagination?.totalPages || 1}
          </span>
          
          <div className="flex items-center gap-1">
            <Input
              className="h-8 w-16 text-center"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGoToPage();
                }
              }}
              aria-label="Go to page"
            />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleGoToPage}
              disabled={!data?.pagination?.totalPages}
            >
              Go
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
