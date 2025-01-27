import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [url] = queryKey;
        const res = await fetch(url as string);

        if (!res.ok) {
          if (res.status >= 500) {
            throw new Error('Server error. Please try again later.');
          }
          throw new Error(await res.text());
        }

        return res.json();
      },
      refetchOnWindowFocus: false,
      retry: false,
    },
    mutations: {
      retry: false,
    }
  },
});

// Simple function to construct pagination URL
export const getPaginatedUrl = (baseUrl: string, page: number, limit: number) => 
  `${baseUrl}?page=${page}&limit=${limit}`;