import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Book, BookOpen, Calendar, User, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

// Bio section component with proper hook usage
const DescriptionSection = ({ description }: { description: string }) => {
  const [showFullDescription, setShowFullDescription] = React.useState(false);
  const MAX_VISIBLE_CHARACTERS = 720; // Show first characters initially
  
  // Truncate by character count
  const visibleDescription = showFullDescription 
    ? description 
    : description.substring(0, MAX_VISIBLE_CHARACTERS) + (description.length > MAX_VISIBLE_CHARACTERS ? '...' : '');
  
  const hasMoreContent = description.length > MAX_VISIBLE_CHARACTERS;
  
  return (
    <div className="text-sm leading-relaxed">
      <p>{visibleDescription}</p>
      {hasMoreContent && (
        <Button 
          variant="link" 
          size="sm" 
          className="px-0 mt-2 font-bold" 
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show Less -" : "Show More +"}
        </Button>
      )}
    </div>
  );
};

interface Book {
  book: {
    title: string[];
    description: string[];
    image_url: string[];
    link: string[];
    authors: Array<{
      author: Array<{
        name: string[];
      }>;
    }>;
  };
  ratings: {
    user_rating: string;
    average_rating: string;
  };
  shelves?: {
    shelf: Array<{
      $: {
        name: string;
      };
    }>;
  };
}

interface BookDetailsModalProps {
  review: Book;
  isOpen: boolean;
  onClose: () => void;
  allBooks: Book[];
  currentIndex: number;
}

export function BookDetailsModal({
  review,
  isOpen,
  onClose,
  allBooks,
  currentIndex,
}: BookDetailsModalProps) {
  const [currentBook, setCurrentBook] = React.useState(review);
  const [currentIdx, setCurrentIdx] = React.useState(currentIndex);

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setCurrentBook(allBooks[currentIdx - 1]);
    }
  };

  const handleNext = () => {
    if (currentIdx < allBooks.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setCurrentBook(allBooks[currentIdx + 1]);
    }
  };

  React.useEffect(() => {
    setCurrentBook(review);
    setCurrentIdx(currentIndex);
  }, [review, currentIndex]);
  if (!review || !review.book) return null;

  const title = currentBook?.book[0]?.title?.[0] ?? "Untitled Book";
  const imageUrl = currentBook?.book[0]?.image_url?.[0] ?? "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";
  const authorName = currentBook?.book[0]?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown Author";
  const description = currentBook?.book[0]?.description?.[0]?.replace(/<[^>]*>/g, "") ?? "No description available";
  const bookLink = currentBook?.book[0]?.link?.[0] ?? "#";
  const userRating = parseFloat(currentBook.ratings?.user_rating ?? "0");
  const averageRating = parseFloat(currentBook.ratings?.average_rating ?? "0");
  const shelves = currentBook.shelves?.shelf ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[820px] max-h-[80vh] min-h-[600px] overflow-y-auto bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <DialogHeader className="flex flex-col space-y-2">
          <DialogTitle className="font-slackey text-2xl text-center">
            {title}
          </DialogTitle>
          <p className="text-center text-sm text-muted-foreground">
            by {authorName}
          </p>
        </DialogHeader>

        <motion.div 
          className="space-y-4 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Stats and Image Section - Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stats Section - Left 1/2 */}
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg border border-primary/20">
                <Star className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-slackey">Your Rating</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={`user-${i}`}
                        className={`text-sm ${i < userRating ? "text-black" : "text-gray-400"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                <Star className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <div>
                     <span className="text-xs font-bold font-slackey">Average Rating: </span><span className="text-xs">{averageRating}</span>
                  </div>
                 
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={`avg-${i}`}
                        className={`text-sm ${i < averageRating ? "text-black" : "text-gray-400"}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {shelves && shelves.length > 0 && (
                <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
                  <BookOpen className="h-8 w-8 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold font-slackey">Shelves</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {shelves.map((shelf, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-black">
                          {shelf.$.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <a
                href={bookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg hover:bg-muted/80 transition-colors"
              >
                <Book className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold font-slackey">View on Goodreads</span>
              </a>

              <div className="flex justify-between items-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIdx === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentIdx === allBooks.length - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
            </div>

            {/* Book Image - Right 1/2 */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className="relative overflow-hidden rounded-lg h-auto">
                <motion.img
                  src={imageUrl}
                  alt={title}
                  className="w-auto h-full max-h-[350px] object-cover rounded-lg shadow-md mx-auto"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <Book className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Description</h3>
            </div>

            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <DescriptionSection description={description} />
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}