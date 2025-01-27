import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error(`${res.status}: ${res.statusText}`);
          }

          throw new Error(`${res.status}: ${await res.text()}`);
        }

        return res.json();
      },
      // Set reasonable stale time for caching (5 minutes)
      staleTime: 5 * 60 * 1000,
      // Enable cache data persistence (renamed from cacheTime to gcTime in v5)
      gcTime: 10 * 60 * 1000,
      // Allow refetching on window focus for fresh data
      refetchOnWindowFocus: true,
      // Allow retries for failed requests
      retry: 2,
      // Add default select function to handle pagination data
      select: (data: any) => {
        if (data.pagination) {
          return {
            data: data.shows || data.venues,
            pagination: data.pagination,
          };
        }
        return data;
      },
    },
    mutations: {
      retry: false,
    }
  },
});

// Helper function to get cache key for paginated queries
export const getPaginationQueryKey = (baseKey: string, page: number, limit: number) => 
  [baseKey, { page, limit }];

// Helper function to prefetch next page
export const prefetchNextPage = async (baseKey: string, currentPage: number, limit: number) => {
  const nextPage = currentPage + 1;
  await queryClient.prefetchQuery({
    queryKey: getPaginationQueryKey(baseKey, nextPage, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};