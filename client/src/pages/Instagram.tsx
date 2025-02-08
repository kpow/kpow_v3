import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import axios from "axios";
import { InstagramFeed } from "../components/InstagramFeed";
import { CustomPagination } from "@/components/ui/custom-pagination";
import { PageTitle } from "@/components/ui/page-title";
import { useToast } from "@/hooks/use-toast";

const ITEMS_PER_PAGE = 9;

interface InstagramResponse {
  posts: any[];
  pagination: {
    next_token?: string;
    has_next_page: boolean;
  };
}

interface PageTokens {
  [key: number]: string;
}

export default function Instagram() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/instagram/page/:page");
  const page = params?.page ? parseInt(params.page) : 1;
  const { toast } = useToast();
  const [pageTokens, setPageTokens] = useState<PageTokens>({});

  const { data, isLoading, error } = useQuery<InstagramResponse>({
    queryKey: ["instagram", page],
    queryFn: async () => {
      const response = await axios.get('/api/instagram/feed', {
        params: {
          pageSize: ITEMS_PER_PAGE,
          pageToken: pageTokens[page - 1] || "",
        },
      });

      if (response.data.pagination.next_token) {
        setPageTokens((prev: PageTokens) => ({
          ...prev,
          [page]: response.data.pagination.next_token,
        }));
      }

      return response.data;
    },
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  if (error) {
    toast({
      title: "Error loading Instagram feed",
      description: error instanceof Error ? error.message : "Please try again later",
      variant: "destructive",
    });
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) return;
    if (!data?.pagination.has_next_page && newPage > page) return;
    setLocation(newPage === 1 ? "/instagram" : `/instagram/page/${newPage}`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-col sm:flex-row">
        <PageTitle size="lg">instagram feed</PageTitle>
        <CustomPagination
          currentPage={page}
          totalPages={data?.pagination.has_next_page ? page + 1 : page}
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
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-500">
            Error loading Instagram feed. Please try again later.
          </p>
        </div>
      ) : (
        <>
          <InstagramFeed
            posts={data?.posts || []}
            onLoadMore={() => {}}
            hasMore={data?.pagination.has_next_page || false}
            isLoadingMore={false}
          />
        </>
      )}

      <CustomPagination
        currentPage={page}
        totalPages={data?.pagination.has_next_page ? page + 1 : page}
        baseUrl="/instagram"
        onPageChange={handlePageChange}
        className="mt-8"
      />
    </div>
  );
}