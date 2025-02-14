import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";
import { SetlistGame } from "@/components/setlist-game";
import { BookFeed } from "@/components/BookFeed";
import { GitHubSection } from "@/components/GitHubSection";
import { InstagramCarousel } from "@/components/InstagramCarousel";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { ShopSlider } from "@/components/shop-slider";
import { cities } from "@/data/cities";
import SectionHeader from "@/components/SectionHeader";
import HorizontalDivider from "@/components/HorizontalDivider";
import { SEO } from "@/components/SEO";
import { StarFeed } from "@/components/StarFeed";

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
    enabled: Boolean(currentCity.city && currentCity.state),
    retry: 1,
    refetchOnWindowFocus: false
  });

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

  return (
    <>
      <SEO
        title="KPOW - Into the Singularity"
        description="A comprehensive cross-domain media and location analytics platform featuring an interactive Phish setlist guessing game that provides an engaging music trivia experience."
        image="/phash.jpg"
      />
      <div className="space-y-8 mt-4">
        {/* main cards and setlist game */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mainSections.map((section) => (
                <ContentSection key={section.title} {...section} />
              ))}
            </div>
          </div>
          <div className="lg:w-1/2">
            <SetlistGame />
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
        <SectionHeader title="Recently Played" />
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
