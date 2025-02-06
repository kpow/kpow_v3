import React, { useState, useCallback, useEffect } from 'react';
import Modal from 'react-modal';
import { Button } from './ui/button';
import { Card } from './ui/card';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Types for Instagram media
interface InstagramMediaChild {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  media_url: string;
  thumbnail_url?: string;
}

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
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

interface InstagramFeedProps {
  posts: InstagramMedia[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export const InstagramFeed: React.FC<InstagramFeedProps> = ({
  posts = [],  // Provide default empty array
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
    dragFree: false
  });

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  // Reset state when posts change or component unmounts
  useEffect(() => {
    setCurrentPostIndex(0);
    setCurrentMediaIndex(0);
    setModalIsOpen(false);

    // Reset scroll states when posts change
    if (emblaApi) {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    }
  }, [posts, emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    // Update scroll states whenever slides change
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    // Initial scroll state update
    onSelect();

    // Subscribe to select events
    emblaApi.on('select', onSelect);
    // Subscribe to settle events to update states after animations
    emblaApi.on('settle', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('settle', onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleOpenModal = (postIndex: number) => {
    if (postIndex >= 0 && postIndex < posts.length) {
      setCurrentPostIndex(postIndex);
      setCurrentMediaIndex(0);
      setModalIsOpen(true);
    }
  };

  const handleCloseModal = () => {
    setModalIsOpen(false);
    setCurrentMediaIndex(0);
  };

  const getCurrentMedia = () => {
    const post = posts[currentPostIndex];
    if (!post) return null;

    if (post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.[currentMediaIndex]) {
      return post.children.data[currentMediaIndex];
    }
    return post;
  };

  const handlePreviousMedia = () => {
    const post = posts[currentPostIndex];
    if (post?.media_type === 'CAROUSEL_ALBUM' && post.children) {
      setCurrentMediaIndex(prev => 
        prev > 0 ? prev - 1 : post.children!.data.length - 1
      );
    }
  };

  const handleNextMedia = () => {
    const post = posts[currentPostIndex];
    if (post?.media_type === 'CAROUSEL_ALBUM' && post.children) {
      setCurrentMediaIndex(prev => 
        prev < post.children!.data.length - 1 ? prev + 1 : 0
      );
    }
  };

  const handlePreviousPost = () => {
    setCurrentPostIndex(prev => (prev > 0 ? prev - 1 : posts.length - 1));
    setCurrentMediaIndex(0);
  };

  const handleNextPost = () => {
    setCurrentPostIndex(prev => (prev < posts.length - 1 ? prev + 1 : 0));
    setCurrentMediaIndex(0);
  };

  const renderMedia = (media: InstagramMedia | InstagramMediaChild | null, inModal: boolean = false) => {
    if (!media) return null;

    if (inModal) {
      if (media.media_type === 'VIDEO') {
        return (
          <video 
            src={media.media_url}
            controls
            className="w-full aspect-video object-contain bg-black"
            poster={media.thumbnail_url}
          />
        );
      }
    } else {
      if (media.media_type === 'VIDEO' && media.thumbnail_url) {
        return (
          <img 
            src={media.thumbnail_url}
            alt={('caption' in media && media.caption) || 'Instagram video thumbnail'}
            className="w-full h-full object-cover"
          />
        );
      }
    }

    return (
      <img 
        src={media.media_url}
        alt={('caption' in media && media.caption) || 'Instagram post'}
        className={inModal ? "w-full aspect-video object-contain bg-black" : "w-full h-full object-cover"}
      />
    );
  };

  const shouldLoadMore = useCallback(() => {
    if (!emblaApi || !hasMore || isLoadingMore) return false;
    const lastSlideInView = emblaApi.slidesInView().slice(-1)[0];
    const totalSlides = emblaApi.scrollSnapList().length;
    return lastSlideInView >= totalSlides - 4;
  }, [emblaApi, hasMore, isLoadingMore]);

  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      if (shouldLoadMore()) {
        onLoadMore();
      }
    };

    emblaApi.on('scroll', onScroll);
    emblaApi.on('settle', onScroll);

    return () => {
      emblaApi.off('scroll', onScroll);
      emblaApi.off('settle', onScroll);
    };
  }, [emblaApi, shouldLoadMore, onLoadMore]);

  // Set modal app element for accessibility
  useEffect(() => {
    Modal.setAppElement('#root');
  }, []);

  const currentPost = posts[currentPostIndex];
  const currentMedia = getCurrentMedia();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {posts.map((post, index) => (
              <div key={`${post.id}-${index}`} className="flex-[0_0_100%] sm:flex-[0_0_50%] md:flex-[0_0_33.333%] lg:flex-[0_0_25%] min-w-0 px-2">
                <Card 
                  className="aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                  onClick={() => handleOpenModal(index)}
                >
                  {renderMedia(post)}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="font-slackey text-sm line-clamp-2">
                      {post.caption}
                    </p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-blue-600 hover:bg-blue-700 text-primary-foreground -left-5 ${
            !canScrollPrev ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={scrollPrev}
          disabled={!canScrollPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-blue-600 hover:bg-blue-700 text-primary-foreground -right-5 ${
            !canScrollNext ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={scrollNext}
          disabled={!canScrollNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleCloseModal}
        className="max-w-6xl mx-auto mt-10 bg-black rounded-lg overflow-hidden"
        overlayClassName="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4"
      >
        {currentPost && currentMedia && (
          <div className="relative flex flex-col">
            <Button
              variant="outline"
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/75 text-white"
              onClick={handleCloseModal}
            >
              ✕
            </Button>

            <div className="relative">
              {renderMedia(currentMedia, true)}

              <Button
                variant="outline"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white"
                onClick={handlePreviousPost}
              >
                ←
              </Button>

              <Button
                variant="outline"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white"
                onClick={handleNextPost}
              >
                →
              </Button>

              {currentPost.media_type === 'CAROUSEL_ALBUM' && currentPost.children && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousMedia}
                    className="p-2 bg-black/50 hover:bg-black/75 text-white"
                  >
                    ←
                  </Button>
                  <span className="bg-black/50 text-white px-3 py-1 rounded">
                    {currentMediaIndex + 1} / {currentPost.children.data.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextMedia}
                    className="p-2 bg-black/50 hover:bg-black/75 text-white"
                  >
                    →
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-white p-3 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-500">
                  {new Date(currentPost.timestamp).toLocaleDateString()}
                </span>
                {currentPost.location && (
                  <span className="text-gray-500">
                    📍 {currentPost.location.name}
                  </span>
                )}
                <span className="line-clamp-1 flex-1">
                  {currentPost.caption}
                </span>
              </div>
              <a
                href={currentPost.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline whitespace-nowrap"
              >
                View on Instagram
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default InstagramFeed;