import React, { useState } from 'react';
import Modal from 'react-modal';
import { Button } from './ui/button';
import { Card } from './ui/card';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
}

interface InstagramFeedProps {
  posts: InstagramMedia[];
}

export const InstagramFeed: React.FC<InstagramFeedProps> = ({ posts }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true
  });

  const handleOpenModal = (index: number) => {
    setCurrentIndex(index);
    setModalIsOpen(true);
  };

  const handleCloseModal = () => {
    setModalIsOpen(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : posts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < posts.length - 1 ? prev + 1 : 0));
  };

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  return (
    <div className="w-full relative">
      <div className="overflow-hidden relative" ref={emblaRef}>
        <div className="flex gap-4">
          {posts.map((post, index) => (
            <div key={post.id} className="flex-[0_0_300px]" style={{ minWidth: '300px' }}>
              <Card 
                className="overflow-hidden cursor-pointer h-[300px]" 
                onClick={() => handleOpenModal(index)}
              >
                {post.media_type === 'VIDEO' ? (
                  <video 
                    src={post.media_url}
                    className="w-full h-full object-cover"
                    poster={post.thumbnail_url}
                  />
                ) : (
                  <img 
                    src={post.media_url} 
                    alt={post.caption || 'Instagram post'}
                    className="w-full h-full object-cover"
                  />
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Carousel Navigation */}
      <Button
        variant="outline"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/80"
        onClick={scrollNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleCloseModal}
        className="max-w-3xl mx-auto mt-10 outline-none"
        overlayClassName="fixed inset-0 bg-black/90 flex items-center justify-center p-4"
      >
        <div className="bg-white/95 dark:bg-gray-800/95 rounded-lg overflow-hidden relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={handleCloseModal}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="flex flex-col">
            <div className="relative w-full bg-black">
              {posts[currentIndex]?.media_type === 'VIDEO' ? (
                <video 
                  src={posts[currentIndex]?.media_url}
                  controls
                  className="w-full h-auto max-h-[70vh] mx-auto"
                  poster={posts[currentIndex]?.thumbnail_url}
                />
              ) : (
                <img 
                  src={posts[currentIndex]?.media_url}
                  alt={posts[currentIndex]?.caption || 'Instagram post'}
                  className="w-full h-auto max-h-[70vh] mx-auto object-contain"
                />
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 max-w-lg mx-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(posts[currentIndex]?.timestamp).toLocaleDateString()}
              </p>
              <p className="mt-2 text-sm line-clamp-3">{posts[currentIndex]?.caption}</p>
              <a
                href={posts[currentIndex]?.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-blue-500 hover:underline text-sm"
              >
                View on Instagram
              </a>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};