import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import axios from "axios";
import Masonry from "react-masonry-css";
import { VideoCard } from "../components/VideoCard";
import { VideoModal } from "../components/VideoModal";
import { Button } from "../components/ui/button";
import { useState } from "react";

const ITEMS_PER_PAGE = 9;
const PLAYLIST_ID = "PLLnMxi7_aEL7eyC1HiZ2d1d4ce5irHaTQ";

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: string;
}

export default function Videos() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/videos/page/:page");
  const page = params?.page ? parseInt(params.page) : 1;
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [pageTokens, setPageTokens] = useState<Record<number, string>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["videos", page],
    queryFn: async () => {
      const response = await axios.get(`/api/youtube/playlist/${PLAYLIST_ID}`, {
        params: {
          pageSize: ITEMS_PER_PAGE,
          pageToken: pageTokens[page - 1] || "",
        },
      });

      // Store the next page token for future use
      if (response.data.nextPageToken) {
        setPageTokens((prev) => ({
          ...prev,
          [page]: response.data.nextPageToken,
        }));
      }

      return response.data;
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const breakpointCols = {
    default: 3,
    1100: 2,
    700: 1,
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    if (!data?.hasNextPage && newPage > page) return;
    setLocation(newPage === 1 ? "/videos" : `/videos/page/${newPage}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-col sm:flex-row">
        <h1 className="text-4xl font-bold">youtubez live</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          >
            Previous
          </Button>
          <span className="px-4 py-2 text-sm font-medium">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={!data?.hasNextPage}
            className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
          >
            Next
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="animate-pulse h-[300px]">
              <div className="bg-gray-200 h-[100px] w-full aspect-video rounded-lg mb-10" />
              <div className="h-4 bg-gray-200 h-[100px] rounded w-full mb-2" />
              <div className="h-4 bg-gray-200 h-[100px] rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">
            Error loading videos. Please try again later.
          </p>
        </div>
      ) : (
        <>
          <Masonry
            breakpointCols={breakpointCols}
            className="flex -ml-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {data?.items.map((video: Video) => (
              <div key={video.id} className="mb-4">
                <VideoCard
                  {...video}
                  onPlay={() => setSelectedVideo(video.id)}
                />
              </div>
            ))}
          </Masonry>
        </>
      )}
      <div className="flex items-center gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
        >
          Previous
        </Button>
        <span className="px-4 py-2 text-sm font-medium">Page {page}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={!data?.hasNextPage}
          className="bg-blue-600 hover:bg-blue-700 text-xs text-white hover:text-white font-bold py-2 px-4 rounded"
        >
          Next
        </Button>
      </div>
      <VideoModal
        videoId={selectedVideo || ""}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}
