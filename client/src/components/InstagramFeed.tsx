import React, { useState } from 'react';
import Modal from 'react-modal';
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

  // Set modal app element for accessibility
  React.useEffect(() => {
    Modal.setAppElement('#root');
  }, []);

  const currentPost = posts[currentPostIndex];
  const currentMedia = getCurrentMedia();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post, index) => (
          <div key={`${post.id}-${index}`}>
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

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={handleCloseModal}
        className="max-w-6xl mx-auto mt-10 bg-black rounded-lg overflow-hidden"
        overlayClassName="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4"
      >
        {currentPost && currentMedia && (
          <div className="relative flex flex-col">
            <button
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/75 text-white p-2 rounded"
              onClick={handleCloseModal}
            >
              ✕
            </button>

            <div className="relative">
              {renderMedia(currentMedia, true)}

              {currentPost.media_type === 'CAROUSEL_ALBUM' && currentPost.children && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <button
                    onClick={handlePreviousMedia}
                    className="p-2 bg-black/50 hover:bg-black/75 text-white rounded"
                  >
                    ←
                  </button>
                  <span className="bg-black/50 text-white px-3 py-1 rounded">
                    {currentMediaIndex + 1} / {currentPost.children.data.length}
                  </span>
                  <button
                    onClick={handleNextMedia}
                    className="p-2 bg-black/50 hover:bg-black/75 text-white rounded"
                  >
                    →
                  </button>
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