import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface SongData {
  id: number;
  name: string;
  artistId: number | null;
  artistName: string | null;
  playCount: number;
}

interface ArtistData {
  id: number;
  name: string;
  songCount: number;
  totalPlays: number;
}

interface TableData {
  data: (SongData | ArtistData)[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Column definitions for both tables
const songColumns: ColumnDef<SongData>[] = [
  {
    accessorKey: "name",
    header: "Song Name",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.name || "Untitled"}
      </div>
    ),
  },
  {
    accessorKey: "artistName",
    header: "Artist",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.artistName || "Unknown Artist"}
      </div>
    ),
  },
  {
    accessorKey: "playCount",
    header: "Play Count",
    cell: ({ row }) => (
      <div className="font-medium text-right">
        {(row.original.playCount || 0).toLocaleString()}
      </div>
    ),
  },
];

const artistColumns: ColumnDef<ArtistData>[] = [
  {
    accessorKey: "name",
    header: "Artist Name",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.original.name || "Unknown Artist"}
      </div>
    ),
  },
  {
    accessorKey: "songCount",
    header: "Songs",
    cell: ({ row }) => (
      <div className="font-medium text-right">
        {(row.original.songCount || 0).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "totalPlays",
    header: "Total Plays",
    cell: ({ row }) => (
      <div className="font-medium text-right">
        {(row.original.totalPlays || 0).toLocaleString()}
      </div>
    ),
  },
];

export function MusicDataTable() {
  const [dataType, setDataType] = useState<"songs" | "artists">("songs");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading, error } = useQuery<TableData>({
    queryKey: ["/api/music/table-data", { page, pageSize, type: dataType }],
    queryFn: async () => {
      console.log('Fetching table data:', { page, pageSize, type: dataType });
      const response = await fetch(
        `/api/music/table-data?page=${page}&pageSize=${pageSize}&type=${dataType}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch table data");
      }

      const jsonData = await response.json();
      console.log('Received data:', jsonData);

      return {
        data: Array.isArray(jsonData.data) ? jsonData.data : [],
        pagination: {
          page: Number(page),
          pageSize: Number(pageSize),
          total: Number(jsonData.pagination?.total || 0),
          totalPages: Math.ceil(Number(jsonData.pagination?.total || 0) / Number(pageSize))
        }
      };
    }
  });

  console.log('Current table state:', { dataType, page, data });

  // Create table with explicit default values
  const tableData = data?.data || [];
  const table = useReactTable({
    data: tableData,
    columns: dataType === "songs" ? songColumns : artistColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: Number(pageSize),
        pageIndex: page - 1
      }
    },
  });

  if (isLoading) {
    return <TableSkeleton columns={dataType === "songs" ? songColumns : artistColumns} pageSize={pageSize} />;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error instanceof Error ? error.message : "Failed to load data"}
      </div>
    );
  }

  const pagination = data?.pagination || {
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Music Data Explorer</h2>
        <Select
          value={dataType}
          onValueChange={(value: "songs" | "artists") => {
            setDataType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="songs">Songs</SelectItem>
            <SelectItem value="artists">Artists</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
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
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {tableData.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  colSpan={dataType === "songs" ? songColumns.length : artistColumns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {pagination.total} total entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({
  columns,
  pageSize,
}: {
  columns: ColumnDef<any>[];
  pageSize: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((_, index) => (
                <TableHead
                  key={index}
                  className="h-12 px-4 text-left align-middle font-medium"
                >
                  <Skeleton className="h-4 w-24" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: pageSize }).map((_, index) => (
              <TableRow key={index}>
                {columns.map((_, colIndex) => (
                  <TableCell key={colIndex} className="p-4">
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}