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
  total_pages: number;
}

interface DateFilter {
  since: string | null;
  until: string | null;
  month: number | null;
  year: number | null;
}

interface StarredResponse {
  articles: StarredArticle[];
  pagination: PaginationData;
  dateFilter: DateFilter;
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
  dateFilter: DateFilter;
}

export function useStarredArticles(
  page = 1, 
  perPage = 6, 
  month: number | null = null, 
  year: number | null = null
) {
  // Build the query string
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('per_page', perPage.toString());
  
  if (month !== null) {
    params.append('month', month.toString());
  }
  
  if (year !== null) {
    params.append('year', year.toString());
  }
  
  return useQuery<StarredResponse, Error, TransformedResponse>({
    queryKey: [`/api/starred-articles?${params.toString()}`],
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
      pagination: data.pagination,
      dateFilter: data.dateFilter
    })
  });
}