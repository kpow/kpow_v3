// k-shows on the home page. This was the Instagram carousel; same look and
// behaviour, now fed by the showz namer (see lib/showz.ts).
import { useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { ShowCard } from "./ShowCard";
import { ShowModal } from "./ShowModal";
import { toPosts, useShowz } from "@/lib/showz";
import type { ShowPost } from "@/lib/showz";

function shuffleArray<T>(array: T[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function ShowCarousel() {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedPostIndex, setSelectedPostIndex] = useState<number | null>(null);

  const { data: showz, isLoading } = useShowz();
  const data = useMemo(() => (showz ? { posts: toPosts(showz) } : undefined), [showz]);
  // shuffled once per load, so opening a show doesn't reshuffle the row behind it
  const shuffledPosts = useMemo(() => (data ? shuffleArray(data.posts) : []), [data]);

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

  const handlePostClick = (post: ShowPost) => {
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
            {shuffledPosts.map((post) => (
              <CarouselItem key={post.id} className="md:basis-1/3 lg:basis-1/4">
                <div>
                  <ShowCard
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
        <ShowModal
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