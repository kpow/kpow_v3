import Masonry from 'react-masonry-css';
import imageData from '../../../attached_assets/pmonk';
import { useState, useEffect, useRef, useCallback } from 'react';

interface ImageData {
  src: string;
}

interface LoadedImage extends ImageData {
  loaded: boolean;
  visible: boolean;
}

// Breakpoint columns object
const breakpointColumnsObj = {
  default: 4, // Default to 4 columns
  1100: 3,    // At 1100px viewport width, switch to 3 columns
  700: 2,     // At 700px viewport width, switch to 2 columns
  500: 1      // At 500px viewport width, switch to 1 column
};

export const PMonk = () => {
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
  const observers = useRef<{ [key: number]: IntersectionObserver }>({});

  useEffect(() => {
    // Convert imported image data to our state format
    setLoadedImages((imageData as ImageData[]).map(img => ({ 
      ...img, 
      loaded: false,
      visible: false 
    })));
  }, []);

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => 
      prev.map((img, i) => i === index ? { ...img, loaded: true } : img)
    );
  };

  const handleIntersection = useCallback((index: number) => (entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setLoadedImages(prev => 
          prev.map((img, i) => i === index ? { ...img, visible: true } : img)
        );
        // Disconnect the observer once the image is visible
        if (observers.current[index]) {
          observers.current[index].disconnect();
          delete observers.current[index];
        }
      }
    });
  }, []);

  const imageRef = useCallback((node: HTMLDivElement | null, index: number) => {
    if (node && !loadedImages[index]?.visible) {
      // Create a new observer for this image
      observers.current[index] = new IntersectionObserver(handleIntersection(index), {
        rootMargin: '50px 0px', // Start loading images 50px before they enter the viewport
        threshold: 0.1
      });
      observers.current[index].observe(node);
    }
  }, [handleIntersection, loadedImages]);

  // Cleanup observers on unmount
  useEffect(() => {
    return () => {
      Object.values(observers.current).forEach(observer => observer.disconnect());
    };
  }, []);

  return (
    <div className="p-4">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex -ml-4 w-auto"
        columnClassName="pl-4 bg-background"
      >
        {loadedImages.map((image, index) => (
          <div 
            key={index}
            ref={node => imageRef(node, index)}
            className="mb-4 overflow-hidden rounded-lg transition-opacity duration-300"
            style={{ opacity: image.loaded ? 1 : 0 }}
          >
            {image.visible && (
              <img
                src={image.src}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-auto"
                onLoad={() => handleImageLoad(index)}
                loading="lazy"
              />
            )}
          </div>
        ))}
      </Masonry>
    </div>
  );
};

export default PMonk;