import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import axios from "axios";
import { InstagramPerformanceCard } from "../components/InstagramPerformanceCard";
import { InstagramModal } from "@/components/InstagramModal";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 9;

interface InstagramPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  children?: {
    data: Array<{
      id: string;
      media_type: "IMAGE" | "VIDEO";
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
      try {
        const response = await axios.get<InstagramResponse>("/api/instagram/feed", {
          params: {
            page,
            pageSize: ITEMS_PER_PAGE,
          },
        });
        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch Instagram feed";
        throw new Error(errorMessage);
      }
    },
  });

  if (error) {
    toast({
      title: "Error loading Instagram feed",
      description:
        error instanceof Error ? error.message : "Please try again later",
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
            <div key={i} className="animate-pulse aspect-[4/3]">
              <div className="bg-gray-200 h-full w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">
            Error loading Instagram feed. Please try again later.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.posts.map((post, index) => (
              <div key={post.id} className="aspect-[4/3]">
                <InstagramPerformanceCard
                  {...post}
                  onClick={() => handleOpenModal(index)}
                />
              </div>
            ))}
          </div>

          {modalIsOpen && data?.posts && selectedPostIndex !== null && (
            <InstagramModal
              posts={[data.posts[selectedPostIndex]]}
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