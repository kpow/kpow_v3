import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { type Artist } from "@/types/artist";

interface Song {
  id: number;
  name: string;
  albumName: string | null;
  mediaDurationMs: number;
  artistId: number;
  artistName: string;
  artistImageUrl: string | null;
  playCount: number;
  lastPlayed: string | null;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
}

const formatDuration = (ms: number) => {
  if (!ms) return '--:--';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const columnHelper = createColumnHelper<Song>();

interface MusicDataGridProps {
  onArtistClick?: (artist: Artist) => void;
}

export function MusicDataGrid({ onArtistClick }: MusicDataGridProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['songs', page, pageSize],
    queryFn: async () => {
      const response = await axios.get(`/api/music/songs?page=${page}&pageSize=${pageSize}`);
      return response.data;
    }
  });

  const columns = [
    columnHelper.accessor('name', {
      header: ({ column }) => (
        <div className="flex items-center">
          <span className="mr-2">Song</span>
          {column.getIsSorted() && (
            column.getIsSorted() === "asc" ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
          )}
        </div>
      ),
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('artistName', {
      header: ({ column }) => (
        <div className="flex items-center">
          <span className="mr-2">Artist</span>
          {column.getIsSorted() && (
            column.getIsSorted() === "asc" ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
          )}
        </div>
      ),
      cell: info => (
        <Button
          variant="link"
          className="p-0 h-auto font-normal"
          onClick={() => onArtistClick?.({
            id: info.row.original.artistId,
            name: info.getValue(),
          })}
        >
          {info.getValue()}
        </Button>
      ),
    }),
    columnHelper.accessor('albumName', {
      header: ({ column }) => (
        <div className="flex items-center">
          <span className="mr-2">Album</span>
          {column.getIsSorted() && (
            column.getIsSorted() === "asc" ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
          )}
        </div>
      ),
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('mediaDurationMs', {
      header: ({ column }) => (
        <div className="flex items-center">
          <span className="mr-2">Duration</span>
          {column.getIsSorted() && (
            column.getIsSorted() === "asc" ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
          )}
        </div>
      ),
      cell: info => formatDuration(info.getValue()),
    }),
    columnHelper.accessor('lastPlayed', {
      header: ({ column }) => (
        <div className="flex items-center">
          <span className="mr-2">Last Played</span>
          {column.getIsSorted() && (
            column.getIsSorted() === "asc" ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
          )}
        </div>
      ),
      cell: info => info.getValue()
        ? format(new Date(info.getValue()), 'MMM d, yyyy')
        : 'Never',
    }),
    columnHelper.accessor('playCount', {
      header: ({ column }) => (
        <div className="flex items-center">
          <span className="mr-2">Play Count</span>
          {column.getIsSorted() && (
            column.getIsSorted() === "asc" ? 
              <ArrowUp className="h-4 w-4" /> : 
              <ArrowDown className="h-4 w-4" />
          )}
        </div>
      ),
      cell: info => info.getValue(),
    }),
  ];

  const table = useReactTable({
    data: data?.songs || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: data?.pagination?.totalPages ?? -1,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return <div>Error loading data</div>;
  }

  const { pagination } = data;

  return (
    <div className="w-full space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => setPageSize(parseInt(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="25" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
          >
            Previous
          </Button>
          <span>
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, pagination?.totalCount ?? 0)} of {pagination?.totalCount ?? 0}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(pagination?.totalPages ?? 1, p + 1))}
            disabled={page === (pagination?.totalPages ?? 1)}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
          >
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead 
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer"
                  >
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
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}