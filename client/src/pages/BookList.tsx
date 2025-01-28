import { useQuery } from "@tanstack/react-query";
import { BookCard } from "@/components/BookCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Book {
  id: string;
  title: string;
  author: string;
  image_url: string;
  link: string;
  rating: string;
  date_read: string;
  review_text: string;
  shelves: string;
}

interface BooksResponse {
  books: Book[];
  pagination: {
    current: number;
    total: number;
    hasMore: boolean;
    totalBooks: number;
  };
}

export default function BookList() {
  const [page, setPage] = useState(1);
  const [shelf] = useState("read");

  const { data, isLoading, error } = useQuery<BooksResponse>({
    queryKey: [`/api/books?page=${page}&shelf=${shelf}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold font-slackey mb-8">book feed</h1>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex gap-6">
                  <div className="w-[120px] h-[160px] bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-4 py-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded" />
                      <div className="h-4 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold font-slackey mb-4">Oops!</h1>
          <p className="text-gray-600">Something went wrong loading the books.</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold font-slackey">book feed</h1>
          <div className="text-sm text-gray-500">
            {data.pagination.totalBooks} books on the shelf
          </div>
        </div>

        <div className="space-y-6 mb-8">
          {data.books.map((book) => (
            <BookCard
              key={book.id}
              title={book.title}
              author={book.author}
              imageUrl={book.image_url}
              rating={Number(book.rating)}
              description={book.review_text}
              link={book.link}
            />
          ))}
        </div>

        {data.pagination.total > 1 && (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            <div className="text-sm text-gray-500">
              Page {page} of {data.pagination.total}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(page + 1)}
              disabled={!data.pagination.hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}