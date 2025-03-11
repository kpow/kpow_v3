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

interface Song {
  id: number;
  name: string;
  albumName: string;
  mediaDurationMs: number;
  artistId: number;
  artistName: string;
  artistImageUrl: string;
  playCount: number;
  lastPlayed: string;
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

export function MusicDataGrid() {
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
      header: 'Song',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('artistName', {
      header: 'Artist',
      cell: info => (
        <span className="text-blue-500 cursor-pointer hover:underline">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('albumName', {
      header: 'Album',
      cell: info => info.getValue() || '-',
    }),
    columnHelper.accessor('mediaDurationMs', {
      header: 'Duration',
      cell: info => formatDuration(info.getValue()),
    }),
    columnHelper.accessor('lastPlayed', {
      header: 'Last Played',
      cell: info => info.getValue() 
        ? format(new Date(info.getValue()), 'MMM d, yyyy')
        : 'Never',
    }),
    columnHelper.accessor('playCount', {
      header: 'Play Count',
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
  });

  if (isLoading) {
    return <div>Loading...</div>;
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
          >
            Previous
          </Button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
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