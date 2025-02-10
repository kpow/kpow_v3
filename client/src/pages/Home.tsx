import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";
import { BookFeed } from "@/components/BookFeed";
import { GitHubSection } from "@/components/GitHubSection";
import { InstagramFeed } from "@/components/InstagramFeed";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useStarredArticles } from "@/lib/hooks/use-starred-articles";
import { useState, useEffect } from "react";
import { ShopSlider } from "@/components/shop-slider";
import { cities } from "@/data/cities";
import SectionHeader from "@/components/SectionHeader";

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

export default function Home() {
  const getRandomCity = () => {
    const randomIndex = Math.floor(Math.random() * cities.length);
    return {
      city: cities[randomIndex].city,
      state: cities[randomIndex].state,
    };
  };
  const initialCity = getRandomCity();
  const [currentCity, setCurrentCity] = useState({
    city: initialCity.city,
    state: initialCity.state,
  });

  const [allInstagramPosts, setAllInstagramPosts] = useState<InstagramMedia[]>(
    [],
  );

  const { data: instagramData, isLoading: isLoadingInstagram } =
    useQuery<InstagramResponse>({
      queryKey: ["/api/instagram/feed"],
      queryFn: async () => {
        const response = await fetch("/api/instagram/feed");
        if (!response.ok) {
          throw new Error("Failed to fetch Instagram feed");
        }
        const data = await response.json();
        const shuffledPosts = [...data.posts].sort(() => Math.random() - 0.5);
        setAllInstagramPosts(shuffledPosts);
        return data;
      },
    });

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

  const { data: starredData, isLoading: isLoadingStarred } = useStarredArticles(
    1,
    3,
  );

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
    {
      title: "Loading...",
      subtitle: "Please wait",
      author: "Loading",
      date: "Loading",
      imageSrc: "/placeholder-star.png",
      type: "star" as const,
      excerpt: "Loading content...",
    },
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
        <SectionHeader
          title="k-shows"
          buttonText="more insta"
          linkHref="instagram"
        />
        {isLoadingInstagram ? (
          <Skeleton
            key={"skellywelly"}
            className="w-full h-[180px] rounded-lg"
          />
        ) : (
          <>
            <InstagramFeed posts={allInstagramPosts} />
          </>
        )}
      </div>
      <div className="h-px bg-gray-200 my-4" />

      {/* {starred} */}
      <div>
        <SectionHeader
          title="star feed"
          buttonText="more articles"
          linkHref="starred-articles"
        />
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
      <SectionHeader title="Recently Played" />
      <RecentPlays />
      <div className="h-px bg-gray-200 my-4" />

      {/* {books} */}

      <SectionHeader
        title="book feed"
        buttonText="more books"
        linkHref="books"
      />
      <BookFeed />

      <div className="h-px bg-gray-200 my-4" />

      {/* {donuts} */}
      <div>
        <SectionHeader
          title={`donut tour${shops && shops.length > 0 ? ` - ${currentCity.city}, ${currentCity.state}` : ""}`}
          buttonText="more donuts"
          linkHref="donut-shops"
        />
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
