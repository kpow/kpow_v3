import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { BookDetailsModal } from "@/components/BookDetailsModal";

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
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-24 h-36 bg-muted flex items-center justify-center">
              No Image
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Loading...</h3>
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
        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
        onClick={() => setModalOpen(true)}
      >
        <CardContent className="p-0">
          <div className="flex flex-row">
            <div className="w-24 h-36 relative bg-black flex-shrink-0">
              <img
                src={imageUrl}
                alt={title}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 p-3">
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
              <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                {description}
              </p>
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