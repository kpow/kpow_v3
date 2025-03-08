import { ContentSection } from "@/components/home/ContentSection";
import { RecentPlays } from "@/components/home/RecentPlays";
import { SetlistGame } from "@/components/home/setlist-game-static";
import { CubeFrame } from "@/components/home/cube-frame";
import { BookFeed } from "@/components/BookFeed";
import { GitHubSection } from "@/components/home/GitHubSection";
import { InstagramCarousel } from "@/components/instagram/InstagramCarousel";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ShopSlider } from "@/components/donuts/shop-slider";
import { cities } from "@/data/cities";
import SectionHeader from "@/components/global/SectionHeader";
import HorizontalDivider from "@/components/global/HorizontalDivider";
import { SEO } from "@/components/global/SEO";
import { StarFeed } from "@/components/StarFeed";
import { Shop } from "@/types/shop";

interface YelpResponse {
  shops: Shop[];
  metrics: {
    donutResults: number;
    doughnutResults: number;
    totalUniqueShops: number;
    filteredShops: number;
    nearbyShops: number;
    chainStoresFiltered: number;
  };
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

  const { data, isLoading: isLoadingShops } = useQuery<YelpResponse>({
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
    enabled: Boolean(currentCity.city && currentCity.state),
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const shops = data?.shops || [];

  const mainSections = [
    {
      title: "phashboard",
      subtitle: "DIG IN",
      imageSrc: "/phash.jpg",
      type: "main" as const,
      link: "/phashboard",
    },
    {
      title: "battle",
      subtitle: "PLAY",
      imageSrc: "/battle.jpg",
      type: "main" as const,
      link: "/battle",
    },
    {
      title: "uTunes",
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

  return (
    <>
      <SEO
        title="KPOW - Into the Singularity"
        description="A comprehensive cross-domain media and location analytics platform featuring an interactive Phish setlist guessing game that provides an engaging music trivia experience."
        image="/phash.jpg"
      />
      <div className="space-y-8 mt-4">
        {/* main cards and setlist game */}
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {mainSections.map((section) => (
              <ContentSection key={section.title} {...section} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="w-full">
              <SetlistGame />
            </div>
            <div className="w-full">
              <CubeFrame />
            </div>
          </div>
        </div>
        <HorizontalDivider />

        {/* {instagram} */}
        <div>
          <SectionHeader title="k-shows" />
          <InstagramCarousel />
        </div>
        <HorizontalDivider />

        {/* {starred} */}
        <div>
          <SectionHeader
            title="star feed"
            buttonText="more articles"
            linkHref="starred-articles"
          />
          <StarFeed />
        </div>
        <HorizontalDivider />

        {/* {recentPlays} */}
        <SectionHeader
          title="Recently Played"
          buttonText="more music"
          linkHref="itunez"
        />
        <RecentPlays />
        <HorizontalDivider />

        {/* {books} */}
        <SectionHeader
          title="book feed"
          buttonText="more books"
          linkHref="books"
        />
        <BookFeed />
        <HorizontalDivider />

        {/* {donuts} */}
        <div>
          <SectionHeader
            title={`donut tour${shops && shops.length > 0 ? ` - ${currentCity.city}, ${currentCity.state}` : ""}`}
            buttonText="more donuts"
            linkHref="donut-tour"
            currentCity={currentCity}
          />
          {isLoadingShops ? (
            <div className="w-full">
              <Skeleton className="h-[200px] w-full" />
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

        <HorizontalDivider />
        {/* {gitHubz} */}
        <GitHubSection />
      </div>
    </>
  );
}
