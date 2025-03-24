import { useQuery } from "@tanstack/react-query";
import { getRandomDefaultImage } from "@/lib/utils";

export interface StarredArticle {
  id: number;
  title: string;
  author: string;
  summary: string;
  url: string;
  lead_image_url: string | null;
  published: string;
  feed: {
    title: string;
    url: string;
  };
}

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
}

interface StarredResponse {
  articles: StarredArticle[];
  pagination: PaginationData;
}

interface TransformedArticle {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  imageSrc: string;
  type: 'star';
  url: string;
  excerpt: string;
}

interface TransformedResponse {
  articles: TransformedArticle[];
  pagination: PaginationData;
}

export function useStarredArticles(
  page = 1, 
  perPage = 6, 
  month?: number, 
  year?: number
) {
  // Build the query key with optional month/year parameters
  const queryKey = [
    '/api/starred-articles', 
    { page, perPage, month, year }
  ];
  
  // Construct the URL with parameters
  const buildUrl = () => {
    const url = new URL('/api/starred-articles', window.location.origin);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('per_page', perPage.toString());
    
    if (month !== undefined && year !== undefined) {
      url.searchParams.append('month', month.toString());
      url.searchParams.append('year', year.toString());
    }
    
    return url.toString();
  };
  
  return useQuery<StarredResponse, Error, TransformedResponse>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(buildUrl());
      if (!response.ok) {
        throw new Error('Failed to fetch starred articles');
      }
      return response.json();
    },
    select: (data) => ({
      articles: data.articles.map(article => ({
        title: article.title ?? 'Untitled Article',
        subtitle: `by ${article.author ?? 'Unknown Author'}`,
        author: article.author ?? 'Unknown Author',
        date: new Date(article.published).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
        imageSrc: article.lead_image_url ?? getRandomDefaultImage(),
        type: "star" as const,
        url: article.url ?? '#',
        excerpt: article.summary ?? 'No excerpt available'
      })),
      pagination: data.pagination
    })
  });
}