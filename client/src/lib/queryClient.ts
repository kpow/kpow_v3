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
      refetchOnWindowFocus: false,
      retry: 1,
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
    // staleTime: 5 * 60 * 1000, // 5 minutes - Removed as per edited code simplification
  });
};