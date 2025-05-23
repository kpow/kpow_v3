import React, { useState } from 'react';
import Modal from 'react-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  initialPostIndex?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const InstagramFeed: React.FC<InstagramFeedProps> = ({
  posts = [],
  initialPostIndex = 0,
  isOpen = false,
  onClose
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(isOpen);
  const [currentPostIndex, setCurrentPostIndex] = useState(initialPostIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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
    if (onClose) onClose();
  };

  const getCurrentMedia = () => {
    const post = posts[currentPostIndex];
    if (!post) return null;

    if (post.media_type === 'CAROUSEL_ALBUM' && post.children?.data?.[currentMediaIndex]) {
      return post.children.data[currentMediaIndex];
    }
    return post;
  };

  const handlePreviousPost = () => {
    setCurrentPostIndex(prev => (prev > 0 ? prev - 1 : posts.length - 1));
    setCurrentMediaIndex(0);
  };

  const handleNextPost = () => {
    setCurrentPostIndex(prev => (prev < posts.length - 1 ? prev + 1 : 0));
    setCurrentMediaIndex(0);
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

  React.useEffect(() => {
    Modal.setAppElement('#root');
  }, []);

  const currentPost = posts[currentPostIndex];
  const currentMedia = getCurrentMedia();

  return (
    <div className="w-full max-w-7xl mx-auto px-2">
      <Carousel
        opts={{
          align: "start",
          loop: true,
          skipSnaps: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {posts.map((post, index) => (
            <CarouselItem key={`${post.id}-${index}`} className="sm:basis-1/2 md:basis-1/3 lg:basis-1/4 min-w-0">
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
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -left-5" />
        <CarouselNext className="bg-blue-600 hover:bg-blue-700 text-primary-foreground -right-5" />
      </Carousel>

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
              <X className="h-4 w-4" />
            </Button>

            <div className="relative">
              {renderMedia(currentMedia, true)}

              {posts.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white"
                    onClick={handlePreviousPost}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white"
                    onClick={handleNextPost}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {currentPost.media_type === 'CAROUSEL_ALBUM' && currentPost.children && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousMedia}
                    className="p-2 bg-black/50 hover:bg-black/75 text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="bg-black/50 text-white px-3 py-1 rounded">
                    {currentMediaIndex + 1} / {currentPost.children.data.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextMedia}
                    className="p-2 bg-black/50 hover:bg-black/75 text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
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