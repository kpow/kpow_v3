import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { InstagramCard } from "./InstagramCard";
import { InstagramModal } from "./InstagramModal";

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

export function InstagramCarousel() {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  const { data, isLoading } = useQuery<InstagramResponse>({
    queryKey: ["/api/instagram/feed"],
    queryFn: async () => {
      const response = await fetch("/api/instagram/feed");
      if (!response.ok) {
        throw new Error("Failed to fetch Instagram feed");
      }
      const data = await response.json();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="w-full px-2 py-0">
        <div className="items-center gap-2 mb-4">
          <div className="w-full p-2">
            <Skeleton className="md:h-[150px] lg:h-[200px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!data?.posts) {
    return null;
  }

  const handlePostClick = (post: InstagramMedia) => {
    const postIndex = data.posts.findIndex(p => p.id === post.id);
    if (postIndex !== -1) {
      setSelectedPostIndex(postIndex);
      setModalIsOpen(true);
    }
  };

  return (
    <>
      <div className="w-full px-2 py-0">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            slidesToScroll: "auto",
            skipSnaps: true,
            dragFree: false,
          }}
          className="w-full"
        >
          <CarouselContent>
            {data.posts.map((post) => (
              <CarouselItem key={post.id} className="md:basis-1/3 lg:basis-1/4">
                <div onClick={() => handlePostClick(post)}>
                  <InstagramCard
                    id={post.id}
                    media_url={post.media_url}
                    thumbnail_url={post.thumbnail_url}
                    caption={post.caption}
                    timestamp={post.timestamp}
                    media_type={post.media_type}
                    onClick={() => handlePostClick(post)}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -left-3" />
          <CarouselNext className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -right-3" />
        </Carousel>
      </div>

      {modalIsOpen && data.posts && selectedPostIndex !== null && (
        <InstagramModal
          posts={[data.posts[selectedPostIndex]]}
          initialPostIndex={0}
          isOpen={modalIsOpen}
          onClose={() => {
            setModalIsOpen(false);
            setSelectedPostIndex(null);
          }}
        />
      )}
    </>
  );
}