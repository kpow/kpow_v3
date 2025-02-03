import React, { useState } from 'react';
import Modal from 'react-modal';
import { Button } from './ui/button';
import { Card } from './ui/card';

// Types for Instagram media
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

const InstagramFeed: React.FC<InstagramFeedProps> = ({ posts }) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {posts.map((post, index) => (
        <Card key={post.id} className="overflow-hidden cursor-pointer" onClick={() => handleOpenModal(index)}>
          {post.media_type === 'VIDEO' ? (
            <video 
              src={post.media_url}
              className="w-full h-64 object-cover"
              poster={post.thumbnail_url}
            />
          ) : (
            <img 
              src={post.media_url} 
              alt={post.caption || 'Instagram post'}
              className="w-full h-64 object-cover"
            />
          )}
        </Card>
      ))}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleCloseModal}
        className="max-w-4xl mx-auto mt-20 bg-white dark:bg-gray-800 rounded-lg overflow-hidden"
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
            <div className="relative">
              {posts[currentIndex].media_type === 'VIDEO' ? (
                <video 
                  src={posts[currentIndex].media_url}
                  controls
                  className="w-full h-auto"
                  poster={posts[currentIndex].thumbnail_url}
                />
              ) : (
                <img 
                  src={posts[currentIndex].media_url}
                  alt={posts[currentIndex].caption || 'Instagram post'}
                  className="w-full h-auto"
                />
              )}

              <Button
                variant="outline"
                className="absolute left-4 top-1/2 -translate-y-1/2"
                onClick={handlePrevious}
              >
                ←
              </Button>

              <Button
                variant="outline"
                className="absolute right-4 top-1/2 -translate-y-1/2"
                onClick={handleNext}
              >
                →
              </Button>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(posts[currentIndex].timestamp).toLocaleDateString()}
              </p>
              <p className="mt-2">{posts[currentIndex].caption}</p>
              <a
                href={posts[currentIndex].permalink}
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