import React from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { cn } from "@/lib/utils";
import { StarredArticle } from "@/lib/hooks/use-starred-articles";
import { Skeleton } from "@/components/ui/skeleton";

interface StarredArticleBentoProps {
  articles: Array<{
    title: string;
    subtitle: string;
    author: string;
    date: string;
    imageSrc: string;
    url: string;
    excerpt: string;
  }>;
  isLoading?: boolean;
}

// Skeleton component for loading state
const ArticleSkeleton = () => (
  <div className="flex flex-1 w-full h-full min-h-[12rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
);

export function StarredArticleBento({ articles, isLoading = false }: StarredArticleBentoProps) {
  if (isLoading) {
    return (
      <BentoGrid className="mx-auto">
        {Array.from({ length: 9 }).map((_, i) => (
          <BentoGridItem
            key={i}
            title={<Skeleton className="h-6 w-3/4" />}
            description={<Skeleton className="h-4 w-full" />}
            header={<ArticleSkeleton />}
            className={i === 3 || i === 6 ? "md:col-span-2" : ""}
          />
        ))}
      </BentoGrid>
    );
  }

  return (
    <BentoGrid className="mx-auto">
      {articles.map((article, i) => (
        <BentoGridItem
          key={article.url}
          title={article.title}
          description={article.excerpt}
          header={
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full h-full overflow-hidden rounded-xl"
            >
              <div className="relative w-full h-full min-h-[12rem] overflow-hidden group">
                <img
                  src={article.imageSrc}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-50 group-hover:opacity-70 transition-opacity"></div>
              </div>
            </a>
          }
          icon={
            <div className="flex items-center gap-2">
              <div className="text-sm text-neutral-500 flex items-center">
                <span>{article.author}</span>
                <span className="mx-2">•</span>
                <span>{article.date}</span>
              </div>
            </div>
          }
          className={i === 3 || i === 6 || i === 10 || i === 13 ? "md:col-span-2" : ""}
        />
      ))}
    </BentoGrid>
  );
}