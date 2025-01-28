import { useQuery } from "@tanstack/react-query";

export function useStarredArticles(page = 1, perPage = 6) {
  return useQuery({
    queryKey: [`/api/starred-articles?page=${page}&per_page=${perPage}`],
    select: (data: any) => {
      console.log("Raw Feedbin API response:", data);

      const transformed = {
        articles: data.articles.map((article: any) => {
          const transformedArticle = {
            title: article?.title ?? 'Untitled Article',
            subtitle: `by ${article?.author ?? 'Unknown Author'}`,
            author: article?.author ?? 'Unknown Author',
            date: new Date(article?.published ?? Date.now()).toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric'
            }),
            imageSrc: article?.screenshot ?? "/placeholder-star.png",
            type: "star" as const,
            url: article?.url ?? '#'
          };

          console.log("Transformed article:", transformedArticle);
          return transformedArticle;
        }),
        pagination: data.pagination
      };

      return transformed;
    }
  });
}