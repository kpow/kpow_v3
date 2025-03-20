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
  title,
}: {
  column: Column<Artist, unknown>;
  title: string;
}) {
  return (
    <div
      className="flex items-center gap-1 cursor-pointer select-none"
      onClick={() => column.toggleSorting()}
    >
      <span className="font-slackey">{title}</span>
      {column.getIsSorted() === "asc" && <ArrowUp className="h-4 w-4 ml-1" />}
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
  columnHelper.accessor("rank", {
    header: ({ column }) => <SortableHeader column={column} title="Rank" />,
    cell: (info) => (
      <span className="font-semibold text-primary">#{info.getValue()}</span>
    ),
    enableSorting: true,
  }),
  columnHelper.accessor(
    (row) => ({ name: row.name, imageUrl: row.imageUrl || row.artistImageUrl }),
    {
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
    },
  ),
  columnHelper.accessor("listeners", {
    header: ({ column }) => (
      <SortableHeader column={column} title="Listeners" />
    ),
    cell: (info) => info.getValue()?.toLocaleString() || "N/A",
    enableSorting: true,
  }),
  columnHelper.accessor("playcount", {
    header: ({ column }) => (
      <SortableHeader column={column} title="Global Plays" />
    ),
    cell: (info) => info.getValue()?.toLocaleString() || "N/A",
    enableSorting: true,
  }),
  columnHelper.accessor("lastUpdated", {
    header: ({ column }) => (
      <SortableHeader column={column} title="Last Updated" />
    ),
    cell: (info) => {
      const date = info.getValue();
      return date ? format(new Date(date), "PPP") : "N/A";
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      // Handle null dates
      if (!rowA.original.lastUpdated) return 1;
      if (!rowB.original.lastUpdated) return -1;
      return (
        new Date(rowA.original.lastUpdated).getTime() -
        new Date(rowB.original.lastUpdated).getTime()
      );
    },
  }),
];

interface TablePaginationProps {
  table: any;
  pageInput: string;
  setPageInput: (value: string) => void;
  handleGoToPage: () => void;
  totalPages: number;
}

function TablePagination({
  table,
  pageInput,
  setPageInput,
  handleGoToPage,
  totalPages,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Input
            className="h-8 w-16 text-center"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleGoToPage();
              }
            }}
            aria-label="Go to page"
          />
          <Button
            variant="outline"
            size="sm"
            className="font-slackey bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
            onClick={handleGoToPage}
            disabled={!totalPages}
          >
            Go
          </Button>
        </div>
        <span className="text-sm font-bold text-black">
          Page {table.getState().pagination.pageIndex + 1} of {totalPages}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="font-slackey bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="font-slackey bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function LoadingPagination() {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled className="bg-blue-600 text-white">Previous</Button>
        <Button variant="outline" size="sm" disabled className="bg-blue-600 text-white">Next</Button>
      </div>
      <div className="flex items-center gap-2">
        <Input className="h-8 w-16 text-center" disabled value="1" />
        <Button variant="outline" size="sm" disabled className="bg-blue-600 text-white">Go</Button>
        <span className="text-sm font-bold text-black">Page 1 of -</span>
      </div>
    </div>
  );
}

interface ArtistDataTableProps {
  onArtistClick?: (artist: Artist) => void;
  initialPage?: number;
}

export function ArtistDataTable({
  onArtistClick,
  initialPage = 0,
}: ArtistDataTableProps) {
  // Default to sorting by artist name ascending
  const [sorting, setSorting] = useState<SortingState>([
    { id: "artist", desc: false },
  ]);
  const [{ pageIndex, pageSize }, setPagination] = useState({
    pageIndex: initialPage,
    pageSize: 8,
  });

  const [pageInput, setPageInput] = useState<string>(
    (initialPage + 1).toString(),
  );

  // Handle direct page navigation
  const handleGoToPage = () => {
    const totalPages = data?.pagination?.totalPages || 1;
    const parsedPage = parseInt(pageInput, 8);

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
        `/api/table/artists?page=${pageIndex + 1}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
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
        <h2 className="text-2xl font-bold mb-6">all artists played since 2016:</h2>

        <LoadingPagination />

        <div className="rounded-md border">
          <div className="p-4">
            <div className="flex items-center space-x-4 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-32" />
              ))}
            </div>
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">all artists played since 2016:</h2>
      <TablePagination
        table={table}
        pageInput={pageInput}
        setPageInput={setPageInput}
        handleGoToPage={handleGoToPage}
        totalPages={data?.pagination?.totalPages || 1}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
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
                className="cursor-pointer hover:bg-gray-200 even:bg-white odd:bg-gray-50"
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

      <TablePagination
        table={table}
        pageInput={pageInput}
        setPageInput={setPageInput}
        handleGoToPage={handleGoToPage}
        totalPages={data?.pagination?.totalPages || 1}
      />
    </div>
  );
}