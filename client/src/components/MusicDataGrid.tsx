import React, { useState } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export function MusicDataGrid() {
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
    {
      key: 'name',
      name: 'Song',
      width: 200,
      resizable: true,
    },
    {
      key: 'artistName',
      name: 'Artist',
      width: 150,
      resizable: true,
      formatter(props: { row: Song }) {
        return (
          <span className="text-blue-500 cursor-pointer hover:underline">
            {props.row.artistName}
          </span>
        );
      },
    },
    {
      key: 'albumName',
      name: 'Album',
      width: 200,
      resizable: true,
    },
    {
      key: 'mediaDurationMs',
      name: 'Duration',
      width: 100,
      formatter(props: { row: Song }) {
        return formatDuration(props.row.mediaDurationMs);
      },
    },
    {
      key: 'lastPlayed',
      name: 'Last Played',
      width: 150,
      formatter(props: { row: Song }) {
        return props.row.lastPlayed 
          ? format(new Date(props.row.lastPlayed), 'MMM d, yyyy') 
          : 'Never';
      },
    },
    {
      key: 'playCount',
      name: 'Play Count',
      width: 100,
    },
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading data</div>;
  }

  const { songs, pagination } = data;

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
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
          >
            Next
          </Button>
        </div>
      </div>

      <DataGrid
        columns={columns}
        rows={songs}
        className="h-[600px]"
        rowHeight={50}
      />
    </div>
  );
}