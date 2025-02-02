import Masonry from "react-masonry-css";
import imageData from "../../../attached_assets/pmonk";
import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageData {
  src: string;
}

interface LoadedImage extends ImageData {
  loaded: boolean;
  visible: boolean;
}

// Breakpoint columns object
const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

// Fisher-Yates shuffle algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const PMonk = () => {
  const [loadedImages, setLoadedImages] = useState<LoadedImage[]>([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const observers = useRef<{ [key: number]: IntersectionObserver }>({});

  useEffect(() => {
    // Convert imported image data to our state format and shuffle
    setLoadedImages(
      shuffleArray(imageData as ImageData[]).map((img) => ({
        ...img,
        loaded: false,
        visible: false,
      })),
    );
  }, []);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, loaded: true } : img)),
    );
  };

  const handleIntersection = useCallback(
    (index: number) => (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setLoadedImages((prev) =>
            prev.map((img, i) =>
              i === index ? { ...img, visible: true } : img,
            ),
          );
          if (observers.current[index]) {
            observers.current[index].disconnect();
            delete observers.current[index];
          }
        }
      });
    },
    [],
  );

  const imageRef = useCallback(
    (node: HTMLDivElement | null, index: number) => {
      if (node && !loadedImages[index]?.visible) {
        observers.current[index] = new IntersectionObserver(
          handleIntersection(index),
          {
            rootMargin: "50px 0px",
            threshold: 0.1,
          },
        );
        observers.current[index].observe(node);
      }
    },
    [handleIntersection, loadedImages],
  );

  // Cleanup observers on unmount
  useEffect(() => {
    return () => {
      Object.values(observers.current).forEach((observer) =>
        observer.disconnect(),
      );
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          setCurrentImageIndex((prev) =>
            prev === 0 ? loadedImages.length - 1 : prev - 1,
          );
          break;
        case "ArrowRight":
          setCurrentImageIndex((prev) =>
            prev === loadedImages.length - 1 ? 0 : prev + 1,
          );
          break;
        case "Escape":
          setLightboxOpen(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, loadedImages.length]);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === loadedImages.length - 1 ? 0 : prev + 1,
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? loadedImages.length - 1 : prev - 1,
    );
  };

  return (
    <>
      <div className="p-4">
         <h1 className="text-3xl font-bold mb-6">pmonk</h1>
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex -ml-4 w-auto"
          columnClassName="pl-4 bg-background"
        >
          {loadedImages.map((image, index) => (
            <div
              key={index}
              ref={(node) => imageRef(node, index)}
              className="mb-4 overflow-hidden rounded-lg transition-opacity duration-300 cursor-pointer"
              style={{ opacity: image.loaded ? 1 : 0 }}
              onClick={() => openLightbox(index)}
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

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-background/95">
          <div className="relative flex items-center justify-center min-h-[50vh]">
            <Button
              variant="ghost"
              className="absolute -left-10 z-10 p-2 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
              onClick={prevImage}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>

            <img
              src={loadedImages[currentImageIndex]?.src}
              alt={`Gallery image ${currentImageIndex + 1}`}
              className="max-w-full max-h-[90vh] object-contain"
            />

            <Button
              variant="ghost"
              className="absolute -right-10 z-10 p-2 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
              onClick={nextImage}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>

            {/* <Button
              variant="ghost"
              className="absolute -top-2 -right-2 z-100 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button> */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PMonk;
