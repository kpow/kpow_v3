import React, { useState } from 'react';
import Modal from 'react-modal';
import { Button } from './ui/button';
import { Card } from './ui/card';

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

  const renderMedia = (media: InstagramMedia | InstagramMediaChild) => {
    if (media.media_type === 'VIDEO') {
      return (
        <video 
          src={media.media_url}
          controls
          className="w-full h-full object-cover"
          poster={media.thumbnail_url}
        />
      );
    }
    return (
      <img 
        src={media.media_url}
        alt={('caption' in media && media.caption) || 'Instagram post'}
        className="w-full h-full object-cover"
      />
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post, index) => (
          <Card 
            key={post.id} 
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
        ))}
      </div>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleCloseModal}
        className="max-w-5xl mx-auto mt-10 bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4"
      >
        <div className="relative">
          <Button
            variant="outline"
            className="absolute top-4 right-4 z-10"
            onClick={handleCloseModal}
          >
            ✕
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative aspect-square">
              {renderMedia(getCurrentMedia())}

              <Button
                variant="outline"
                className="absolute left-4 top-1/2 -translate-y-1/2"
                onClick={handlePreviousPost}
              >
                ←
              </Button>

              <Button
                variant="outline"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={handleNextPost}
              >
                →
              </Button>

              {posts[currentPostIndex].media_type === 'CAROUSEL_ALBUM' && posts[currentPostIndex].carousel_media && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handlePreviousMedia}
                    className="p-2"
                  >
                    ←
                  </Button>
                  <span className="bg-black bg-opacity-50 text-white px-3 py-1 rounded">
                    {currentMediaIndex + 1} / {posts[currentPostIndex].carousel_media!.length}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextMedia}
                    className="p-2"
                  >
                    →
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(posts[currentPostIndex].timestamp).toLocaleDateString()}
              </p>
              <p className="mt-2">{posts[currentPostIndex].caption}</p>
              <a
                href={posts[currentPostIndex].permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-blue-500 hover:underline"
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

export default InstagramFeed;