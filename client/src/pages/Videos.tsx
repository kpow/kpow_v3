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

  const { data, isLoading } = useQuery({
    queryKey: ["videos", page],
    queryFn: async () => {
      const response = await axios.get(`/api/youtube/playlist/${PLAYLIST_ID}`, {
        params: {
          page,
          pageSize: ITEMS_PER_PAGE,
        },
      });
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
      <h1 className="text-4xl font-bold mb-8">Video Gallery</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-video rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
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

          <div className="flex justify-center gap-4 mt-8">
            <Button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              onClick={() => handlePageChange(page + 1)}
              disabled={!data?.hasNextPage}
            >
              Next
            </Button>
          </div>
        </>
      )}

      <VideoModal
        videoId={selectedVideo || ""}
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />
    </div>
  );
}