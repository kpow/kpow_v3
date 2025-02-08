import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import axios from "axios";
import Masonry from "react-masonry-css";
import { InstagramCard } from "../components/InstagramCard";
import { InstagramFeed } from "../components/InstagramFeed";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 9;

interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  location?: {
    id: string;
    name: string;
  };
  children?: {
    data: Array<{
      id: string;
      media_type: 'IMAGE' | 'VIDEO';
      media_url: string;
      thumbnail_url?: string;
    }>;
  };
}

interface InstagramResponse {
  posts: InstagramPost[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_count: number;
    has_next_page: boolean;
  };
}

export default function Instagram() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/instagram/page/:page");
  const page = params?.page ? parseInt(params.page) : 1;
  const { toast } = useToast();
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const { data, isLoading, error } = useQuery<InstagramResponse>({
    queryKey: ["instagram", page],
    queryFn: async () => {
      console.log('Fetching page:', page);
      const response = await axios.get<InstagramResponse>('/api/instagram/feed', {
        params: {
          page,
          pageSize: ITEMS_PER_PAGE,
        },
      });
      // Log the first post to see if location data is present
      console.log('First post data:', JSON.stringify(response.data.posts[0], null, 2));
      return response.data;
    },
  });

  if (error) {
    toast({
      title: "Error loading Instagram feed",
      description: error instanceof Error ? error.message : "Please try again later",
      variant: "destructive",
    });
  }

  const handlePageChange = (newPage: number) => {
    const totalPages = data?.pagination?.total_pages ?? 1;
    if (newPage < 1 || newPage > totalPages) return;
    window.scrollTo(0, 0);
    setLocation(newPage === 1 ? "/instagram" : `/instagram/page/${newPage}`);
  };

  const handleOpenModal = (index: number) => {
    setSelectedPostIndex(index);
    setModalIsOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPostIndex(null);
    setModalIsOpen(false);
  };

  const breakpointCols = {
    default: 3,
    1100: 2,
    700: 1,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-col sm:flex-row">
        <PageTitle size="lg">instagram feed</PageTitle>
        <CustomPagination
          currentPage={page}
          totalPages={data?.pagination?.total_pages ?? 1}
          baseUrl="/instagram"
          onPageChange={handlePageChange}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-square rounded-lg" />
              <div className="space-y-2 mt-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
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
            {data?.posts.map((post, index) => {
              console.log(`Post ${index} location:`, post.location);
              return (
                <div key={post.id} className="mb-4">
                  <InstagramCard
                    {...post}
                    onClick={() => handleOpenModal(index)}
                  />
                </div>
              );
            })}
          </Masonry>

          {modalIsOpen && data?.posts && selectedPostIndex !== null && (
            <InstagramFeed
              posts={[data.posts[selectedPostIndex]]}
              onLoadMore={() => {}}
              hasMore={false}
              isLoadingMore={false}
              initialPostIndex={0}
              isOpen={modalIsOpen}
              onClose={handleCloseModal}
            />
          )}
        </>
      )}

      <CustomPagination
        currentPage={page}
        totalPages={data?.pagination?.total_pages ?? 1}
        baseUrl="/instagram"
        onPageChange={handlePageChange}
        className="mt-8"
      />
    </div>
  );
}