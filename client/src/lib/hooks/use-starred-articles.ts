import { useQuery } from "@tanstack/react-query";

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
        imageSrc: "/placeholder-star.png", // Default image for articles
        type: "star" as const,
        url: article?.url ?? '#'
      })),
      pagination: data.pagination
    })
  });
}
