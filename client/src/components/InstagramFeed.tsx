import React, { useState } from 'react';
import Modal from 'react-modal';
import { Button } from './ui/button';
import { Card } from './ui/card';
import useEmblaCarousel from 'embla-carousel-react';

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
  carousel_media?: InstagramMediaChild[];
}

interface InstagramFeedProps {
  posts: InstagramMedia[];
}

export const InstagramFeed: React.FC<InstagramFeedProps> = ({ posts }) => {
  const [emblaRef] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1
  });
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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
    if (post.media_type === 'CAROUSEL_ALBUM' && post.carousel_media) {
      return post.carousel_media[currentMediaIndex];
    }
    return post;
  };

  const handlePreviousMedia = () => {
    const post = posts[currentPostIndex];
    if (post.media_type === 'CAROUSEL_ALBUM' && post.carousel_media) {
      setCurrentMediaIndex(prev => 
        prev > 0 ? prev - 1 : post.carousel_media!.length - 1
      );
    }
  };

  const handleNextMedia = () => {
    const post = posts[currentPostIndex];
    if (post.media_type === 'CAROUSEL_ALBUM' && post.carousel_media) {
      setCurrentMediaIndex(prev => 
        prev < post.carousel_media!.length - 1 ? prev + 1 : 0
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
    if (media.media_type === 'VIDEO') {
      return (
        <video 
          src={media.media_url}
          controls
          className={inModal ? "w-full aspect-video object-contain bg-black" : "w-full h-full object-cover"}
          poster={media.thumbnail_url}
        />
      );
    }
    return (
      <img 
        src={media.media_url}
        alt={('caption' in media && media.caption) || 'Instagram post'}
        className={inModal ? "w-full aspect-video object-contain bg-black" : "w-full h-full object-cover"}
      />
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {posts.map((post, index) => (
            <div key={post.id} className="flex-[0_0_25%] min-w-0 px-2">
              <Card 
                className="aspect-square overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => handleOpenModal(index)}
              >
                {renderMedia(post)}
                {post.media_type === 'CAROUSEL_ALBUM' && (
                  <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                    Multiple
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
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

            {posts[currentPostIndex].media_type === 'CAROUSEL_ALBUM' && posts[currentPostIndex].carousel_media && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePreviousMedia}
                  className="p-2 bg-black/50 hover:bg-black/75 text-white"
                >
                  ←
                </Button>
                <span className="bg-black/50 text-white px-3 py-1 rounded">
                  {currentMediaIndex + 1} / {posts[currentPostIndex].carousel_media!.length}
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