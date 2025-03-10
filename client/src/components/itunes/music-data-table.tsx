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

export function MusicDataTable() {
  const [dataType, setDataType] = useState<"songs" | "artists">("songs");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery<TableData>({
    queryKey: ["/api/music/table-data", { page, pageSize, type: dataType }],
    queryFn: async () => {
      const response = await fetch(
        `/api/music/table-data?page=${page}&pageSize=${pageSize}&type=${dataType}`
      );
      if (!response.ok) throw new Error("Failed to fetch table data");
      return response.json();
    },
  });

  const songColumns: ColumnDef<SongData>[] = [
    {
      accessorKey: "name",
      header: "Song Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
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
          {row.original.playCount.toLocaleString()}
        </div>
      ),
    },
  ];

  const artistColumns: ColumnDef<ArtistData>[] = [
    {
      accessorKey: "name",
      header: "Artist Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "songCount",
      header: "Songs",
      cell: ({ row }) => (
        <div className="font-medium text-right">
          {row.original.songCount.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: "totalPlays",
      header: "Total Plays",
      cell: ({ row }) => (
        <div className="font-medium text-right">
          {row.original.totalPlays.toLocaleString()}
        </div>
      ),
    },
  ];

  const columns = dataType === "songs" ? songColumns : artistColumns;
  const table = useReactTable({
    data: data?.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const TableSkeleton = () => (
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

  if (isLoading) {
    return <TableSkeleton />;
  }

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
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hover:text-primary"
                  >
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
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="p-4">
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {data?.pagination.total ?? 0} total entries
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
            Page {page} of {data?.pagination.totalPages ?? 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page === data?.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}