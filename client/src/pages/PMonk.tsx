import Masonry from 'react-masonry-css';
import imageData from '../../../attached_assets/pmonk';
import { useState, useEffect } from 'react';

interface ImageData {
  src: string;
}

interface LoadedImage extends ImageData {
  loaded: boolean;
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

  useEffect(() => {
    // Convert imported image data to our state format
    setLoadedImages((imageData as ImageData[]).map(img => ({ ...img, loaded: false })));
  }, []);

  const handleImageLoad = (index: number) => {
    setLoadedImages(prev => 
      prev.map((img, i) => i === index ? { ...img, loaded: true } : img)
    );
  };

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
            className="mb-4 overflow-hidden rounded-lg transition-opacity duration-300"
            style={{ opacity: image.loaded ? 1 : 0 }}
          >
            <img
              src={image.src}
              alt={`Gallery image ${index + 1}`}
              className="w-full h-auto"
              onLoad={() => handleImageLoad(index)}
              loading="lazy"
            />
          </div>
        ))}
      </Masonry>
    </div>
  );
};

export default PMonk;