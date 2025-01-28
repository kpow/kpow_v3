import { useQuery } from "@tanstack/react-query";

export interface StarredArticle {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  imageSrc: string;
  type: 'star';
  url: string;
}

export function useStarredArticles(page = 1, perPage = 6) {
  return useQuery({
    queryKey: [`/api/starred-articles?page=${page}&per_page=${perPage}`],
    select: (data: any) => ({
      articles: data.articles.map((article: any) => ({
        title: article?.title ?? 'Untitled Article',
        subtitle: `by ${article?.author ?? 'Unknown Author'}`,
        author: article?.author ?? 'Unknown Author',
        date: new Date(article?.published ?? Date.now()).toLocaleDateString('en-US', { 
          month: 'short',
          day: 'numeric'
        }),
        imageSrc: article?.lead_image_url ?? "/placeholder-star.png",
        type: "star" as const,
        url: article?.url ?? '#'
      })),
      pagination: data.pagination
    })
  });
}