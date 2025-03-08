import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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

interface InstagramModalProps {
  posts: InstagramMedia[];
  initialPostIndex?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export const InstagramModal: React.FC<InstagramModalProps> = ({
  posts = [],
  initialPostIndex = 0,
  isOpen = false,
  onClose
}) => {
  const [currentPostIndex, setCurrentPostIndex] = useState(initialPostIndex);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  useEffect(() => {
    setCurrentPostIndex(initialPostIndex);
    setCurrentMediaIndex(0);
  }, [posts, initialPostIndex]);

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
    }

    return (
      <img
        src={media.media_url}
        alt={('caption' in media && media.caption) || 'Instagram post'}
        className={inModal ? "w-full aspect-video object-contain bg-black" : "w-full h-full object-cover"}
      />
    );
  };

  useEffect(() => {
    Modal.setAppElement('#root');
  }, []);

  const currentPost = posts[currentPostIndex];
  const currentMedia = getCurrentMedia();

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      className="max-w-6xl mx-auto mt-10 bg-black rounded-lg overflow-hidden"
      overlayClassName="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4"
    >
      {currentPost && currentMedia && (
        <div className="relative flex flex-col">
          <Button
            variant="outline"
            className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/75 text-white"
            onClick={onClose}
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
  );
};

export default InstagramModal;