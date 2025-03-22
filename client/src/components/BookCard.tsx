import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { BookDetailsModal } from "@/components/BookDetailsModal";
import { Book as BookIcon } from "lucide-react";

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
  shelves: {
    shelf: Array<{
      $: {
        name: string;
      };
    }>;
  };
}

interface BookCardProps {
  review: Book;
}

export function BookCard({ review }: BookCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!review || !review.book) {
    return (
      <Card className="overflow-hidden h-full">
        <CardContent className="p-0">
          <div className="flex flex-row h-full">
            <div className="w-24 h-36 bg-muted flex items-center justify-center rounded-l-md">
              <BookIcon className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <div className="flex-1 p-3">
              <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
              <div className="h-3 w-1/2 bg-muted/70 rounded mb-3"></div>
              <div className="h-3 w-1/4 bg-muted/60 rounded mb-3"></div>
              <div className="h-8 w-full bg-muted/50 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = review?.book[0]?.title?.[0] ?? "Untitled Book";
  const imageUrl = review?.book[0]?.image_url?.[0] ?? "https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png";
  const authorName = review?.book[0]?.authors?.[0]?.author?.[0]?.name?.[0] ?? "Unknown Author";
  const description = review?.book[0]?.description?.[0]?.replace(/<[^>]*>/g, "") ?? "No description available";
  const bookLink = review?.book[0]?.link?.[0] ?? "#";
  const userRating = parseFloat(review.ratings?.user_rating ?? "0");
  const averageRating = parseFloat(review.ratings?.average_rating ?? "0");

  return (
    <>
      <Card 
        className="overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 border-muted hover:border-primary/20"
        onClick={() => setModalOpen(true)}
      >
        <CardContent className="p-0">
          <div className="flex flex-row h-full">
            <div className="w-24 h-36 relative bg-gray-100 flex-shrink-0 flex items-center justify-center rounded-l-md overflow-hidden">
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 p-3 flex flex-col">
              <h3 className="font-semibold text-base line-clamp-1">{title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                by {authorName}
              </p>
              <div className="flex gap-2 mt-2">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={`user-${i}`}
                      className={`text-xs ${i < userRating ? "text-yellow-400" : "text-gray-300"}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mt-2 flex-grow">
                {description}
              </p>
              <div className="mt-2 text-[10px] text-primary/60 font-medium">
                Click for details
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <BookDetailsModal 
        review={review} 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
}