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
  children?: {
    data: InstagramMediaChild[];
  };
}

// Update the InstagramFeedProps interface
interface InstagramFeedProps {
  posts: InstagramMedia[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

export const InstagramFeed: React.FC<InstagramFeedProps> = ({
  posts,
  onLoadMore,
  hasMore,
  isLoadingMore
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 4,
    dragFree: true
  });

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleOpenModal = (postIndex: number) => {
    setCurrentPostIndex(postIndex);
    setCurrentMediaIndex(0);
    setModalIsOpen(true);
  };

  const handleCloseModal = () => {
    setModalIsOpen(false);
    setCurrentMediaIndex(0);
  };

  const getCurrentMedia = () => {
    const post = posts[currentPostIndex];
    if (post.media_type === 'CAROUSEL_ALBUM' && post.children) {
      return post.children.data[currentMediaIndex];
    }
    return post;
  };

  const handlePreviousMedia = () => {
    const post = posts[currentPostIndex];
    if (post.media_type === 'CAROUSEL_ALBUM' && post.children) {
      setCurrentMediaIndex(prev => 
        prev > 0 ? prev - 1 : post.children!.data.length - 1
      );
    }
  };

  const handleNextMedia = () => {
    const post = posts[currentPostIndex];
    if (post.media_type === 'CAROUSEL_ALBUM' && post.children) {
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

  const renderMedia = (media: InstagramMedia | InstagramMediaChild, inModal: boolean = false) => {
    if (inModal) {
      // In modal view, show videos with controls
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
      // In grid view, always show images (thumbnails for videos)
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
    return lastSlideInView >= totalSlides - 4; // Load more when approaching the end
  }, [emblaApi, hasMore, isLoadingMore]);

  // Add scroll monitoring for infinite load
  useEffect(() => {
    if (!emblaApi) return;

    const onScroll = () => {
      if (shouldLoadMore()) {
        onLoadMore();
      }
    };

    emblaApi.on('scroll', onScroll);
        // Also check when slides become settled
    emblaApi.on('settle', onScroll);


    return () => {
      emblaApi.off('scroll', onScroll);
      emblaApi.off('settle', onScroll);
    };
  }, [emblaApi, shouldLoadMore, onLoadMore]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {posts.map((post, index) => (
              <div key={post.id} className="flex-[0_0_25%] min-w-0 px-2">
                <Card 
                  className="aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                  onClick={() => handleOpenModal(index)}
                >
                  {renderMedia(post)}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-70 transition-opacity group-hover:opacity-90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="font-slackey text-sm line-clamp-2 mb-2">
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
        <div className="relative flex flex-col">
          <Button
            variant="outline"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/75 text-white"
            onClick={handleCloseModal}
          >
            ✕
          </Button>

          <div className="relative">
            {renderMedia(getCurrentMedia(), true)}

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

            {posts[currentPostIndex].media_type === 'CAROUSEL_ALBUM' && posts[currentPostIndex].children && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousMedia}
                  className="p-2 bg-black/50 hover:bg-black/75 text-white"
                >
                  ←
                </Button>
                <span className="bg-black/50 text-white px-3 py-1 rounded">
                  {currentMediaIndex + 1} / {posts[currentPostIndex].children!.data.length}
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
                {new Date(posts[currentPostIndex].timestamp).toLocaleDateString()}
              </span>
              <span className="line-clamp-1 flex-1">
                {posts[currentPostIndex].caption}
              </span>
            </div>
            <a
              href={posts[currentPostIndex].permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline whitespace-nowrap"
            >
              View on Instagram
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InstagramFeed;