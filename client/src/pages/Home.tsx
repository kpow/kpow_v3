import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";
import { BookFeed } from "@/components/BookFeed";
import { GitHubSection } from "@/components/GitHubSection";
import { InstagramFeed } from "@/components/InstagramFeed";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useStarredArticles } from "@/lib/hooks/use-starred-articles";
import { useState, useEffect } from "react";
import { ShopSlider } from "@/components/shop-slider";
import { cities } from "@/data/cities";
import { useToast } from "@/hooks/use-toast";

interface Author {
  name: string[];
}

interface Book {
  book: {
    title_without_series: string[];
    description: string[];
    image_url: string[];
    link: string[];
    authors: Array<{
      author: Array<Author>;
    }>;
    average_rating: string[];
  };
}

interface GoodreadsResponse {
  GoodreadsResponse: {
    reviews: Array<{
      $: { start: string; end: string; total: string };
      review: Book[];
    }>;
  };
}

interface InstagramMediaChild {
  id: string;
  media_type: "IMAGE" | "VIDEO";
  media_url: string;
  thumbnail_url?: string;
}

interface InstagramMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  location?: {
    id: string;
    name: string;
  };
  children?: {
    data: InstagramMediaChild[];
  };
}

interface InstagramResponse {
  posts: InstagramMedia[];
  paging: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  } | null;
}

interface Shop {
  id: string;
  name: string;
  rating: number;
  price?: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  image_url?: string;
  url: string;
}

const getRandomCity = () => {
  const randomIndex = Math.floor(Math.random() * cities.length);
  return {
    city: cities[randomIndex].city,
    state: cities[randomIndex].state,
  };
};

export default function Home() {
  const [instagramAfter, setInstagramAfter] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [allInstagramPosts, setAllInstagramPosts] = useState<InstagramMedia[]>(
    [],
  );
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const initialCity = getRandomCity();
  const [currentCity, setCurrentCity] = useState({
    city: initialCity.city,
    state: initialCity.state,
  });

  const { data: bookData, isLoading: isLoadingBooks } =
    useQuery<GoodreadsResponse>({
      queryKey: ["/api/books"],
    });

  const { data: instagramData, isLoading: isLoadingInstagram } =
    useQuery<InstagramResponse>({
      queryKey: ["/api/instagram/feed"],
      queryFn: async () => {
        const response = await fetch("/api/instagram/feed");
        if (!response.ok) {
          throw new Error("Failed to fetch Instagram feed");
        }
        const data = await response.json();
        if (data.paging?.cursors?.after) {
          setInstagramAfter(data.paging.cursors.after);
        }
        setAllInstagramPosts(data.posts);
        return data;
      },
    });

  const loadMoreInstagramPosts = async () => {
    if (!instagramAfter || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `/api/instagram/feed?after=${instagramAfter}`,
      );
      if (!response.ok) throw new Error("Failed to fetch more posts");

      const newData = await response.json();

      setAllInstagramPosts((prev) => [...prev, ...newData.posts]);

      if (newData.paging?.cursors?.after) {
        setInstagramAfter(newData.paging.cursors.after);
      } else {
        setInstagramAfter(null);
      }

      queryClient.setQueryData<InstagramResponse>(
        ["/api/instagram/feed"],
        (oldData) => {
          if (!oldData) return newData;
          return {
            ...newData,
            posts: [...oldData.posts, ...newData.posts],
          };
        },
      );
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const { data: starredData, isLoading: isLoadingStarred } = useStarredArticles(
    1,
    3,
  );

  const reviews = bookData?.GoodreadsResponse?.reviews?.[0]?.review || [];
  const firstBook = reviews[0]?.book;

  const firstBookTitle = firstBook?.title_without_series?.[0];
  const firstBookAuthor = firstBook?.authors?.[0]?.author?.[0]?.name?.[0];
  const firstBookRating = firstBook?.average_rating?.[0];

  const mainSections = [
    {
      title: "phashboard",
      subtitle: "DIG IN",
      imageSrc: "/phash.jpg",
      type: "main" as const,
      link: "/stats",
    },
    {
      title: "battle",
      subtitle: "PLAY",
      imageSrc: "/battle.jpg",
      type: "main" as const,
      link: "/battle",
    },
    {
      title: "tunes",
      subtitle: "LISTEN",
      imageSrc: "/tunes.jpg",
      type: "main" as const,
      link: "/videos",
    },
    {
      title: "pmonk",
      subtitle: "CHECKIT",
      imageSrc: "/pmonk.jpg",
      type: "main" as const,
      link: "/pmonk",
    },
  ];

  const bookFeed = [
    {
      title: firstBook?.title_without_series?.[0] ?? "Untitled",
      subtitle: `by ${firstBook?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown"}`,
      imageSrc: firstBook?.image_url?.[0] ?? "/placeholder-book.png",
      type: "book" as const,
      rating: parseFloat(firstBook?.average_rating?.[0] ?? "0"),
      description: firstBook?.description?.[0]?.replace(/<[^>]*>/g, "") ?? "",
    },
    {
      title: reviews[1]?.book?.title_without_series?.[0] ?? "Untitled",
      subtitle: `by ${reviews[1]?.book?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown"}`,
      imageSrc: reviews[1]?.book?.image_url?.[0] ?? "/placeholder-book.png",
      type: "book" as const,
      rating: parseFloat(reviews[1]?.book?.average_rating?.[0] ?? "0"),
      description:
        reviews[1]?.book?.description?.[0]?.replace(/<[^>]*>/g, "") ?? "",
    },
  ];

  const starFeed = starredData?.articles ?? [
    {
      title: "Loading...",
      subtitle: "Please wait",
      author: "Loading",
      date: "Loading",
      imageSrc: "/placeholder-star.png",
      type: "star" as const,
      excerpt: "Loading content...",
    },
  ];

  const { data: shops, isLoading: isLoadingShops } = useQuery<Shop[]>({
    queryKey: ["/api/yelp/search", currentCity],
    queryFn: async () => {
      const location = `${currentCity.city}, ${currentCity.state}`;
      const response = await fetch(
        `/api/yelp/search?location=${encodeURIComponent(location)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch donut shops");
      }
      return response.json();
    },
  });

  if (isLoadingBooks || isLoadingStarred) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-[200px] w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 mt-4">
      {/* main cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {mainSections.map((section) => (
          <ContentSection key={section.title} {...section} />
        ))}
      </div>

      <div className="h-px bg-gray-200 my-4" />

      {/* {instagram} */}
      <div>
        <h2 className="text-2xl font-bold font-slackey">k-showz on insta</h2>
        {isLoadingInstagram ? (
          <div className="grid grid-cols-2 md:grid-cols-3  h-[400px] lg:grid-cols-4 gap-4">
            <Skeleton
              key={"skellywelly"}
              className="w-full h-[400px] rounded-lg"
            />
          </div>
        ) : (
          <>
            <InstagramFeed
              posts={allInstagramPosts}
              onLoadMore={loadMoreInstagramPosts}
              hasMore={!!instagramAfter}
              isLoadingMore={isLoadingMore}
            />
          </>
        )}
      </div>

      <div className="h-px bg-gray-200 my-4" />
      {/* {starred} */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">star feed</h2>
          <Link key="StarFeed" href="starred-articles">
            <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
              more articles
            </button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoadingStarred
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))
            : starFeed.map((star) => (
                <ContentSection
                  key={star.title}
                  {...star}
                  excerpt={star.excerpt}
                />
              ))}
        </div>
      </div>

      <div className="h-px bg-gray-200 my-4" />

      {/* {recentPlays} */}
      <RecentPlays />

      <div className="h-px bg-gray-200 my-4" />

      {/* {books} */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">book feed</h2>
          <Link key="BookFeed" href="books">
            <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
              more books
            </button>
          </Link>
        </div>
        <BookFeed />
      </div>

      <div className="h-px bg-gray-200 my-4" />
      {/* {donuts} */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">
            donut tour{" "}
            {shops && shops.length > 0
              ? `- ${currentCity.city}, ${currentCity.state}`
              : ""}
          </h2>
          <Link href="/donut-shops">
            <button className="bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
              explore donut shops
            </button>
          </Link>
        </div>
        {isLoadingShops ? (
          <div className="w-full">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : shops && shops.length > 0 ? (
          <div className="h-full w-full rounded-lg overflow-hidden">
            <ShopSlider
              shops={shops}
              onShopClick={(shop) => {
                window.open(shop.url, "_blank");
              }}
            />
          </div>
        ) : null}
      </div>

      <div className="h-px bg-gray-200 my-4" />
      {/* {gitHubz} */}
      <GitHubSection />

      <div className="h-px bg-gray-200 my-4" />
    </div>
  );
}
