import { ContentSection } from "@/components/ContentSection";
import { RecentPlays } from "@/components/RecentPlays";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

interface Book {
  id: string;
  title: string;
  author: string;
  image_url: string;
  link: string;
  rating: string;
  date_read: string;
  review_text: string;
}

interface BooksResponse {
  books: Book[];
  pagination: {
    current: number;
    total: number;
    hasMore: boolean;
  };
}

export default function Home() {
  const { data: booksData } = useQuery<BooksResponse>({
    queryKey: ['/api/books?limit=2'],
  });

  const mainSections = [
    {
      title: "battle",
      subtitle: "PLAY",
      imageSrc: "/battle.jpg",
      type: 'main' as const
    },
    {
      title: "tunes",
      subtitle: "LISTEN",
      imageSrc: "/tunes.jpg",
      type: 'main' as const
    },
    {
      title: "pmonk",
      subtitle: "CREDIT",
      imageSrc: "/pmonk.jpg",
      type: 'main' as const
    }
  ];

  const starFeed = [
    {
      title: "AI-Generated Disinformation",
      subtitle: "Understanding its Impact and Implications",
      author: "Tech Research",
      date: "Jan 24",
      imageSrc: "/placeholder-star.png",
      type: 'star' as const
    },
    {
      title: "The Future of Lead Generation",
      subtitle: "Why First Party Data Will Define 2025",
      author: "Marketing Insights",
      date: "Jan 23",
      imageSrc: "/placeholder-star.png",
      type: 'star' as const
    },
    {
      title: "Understanding API WebSockets",
      subtitle: "How They Work, Benefits, and Best Practices",
      author: "Dev Community",
      date: "Jan 22",
      imageSrc: "/placeholder-star.png",
      type: 'star' as const
    }
  ];

  const bookFeed = booksData?.books.map(book => ({
    title: book.title,
    subtitle: `by ${book.author}`,
    imageSrc: book.image_url,
    type: 'book' as const,
    rating: Number(book.rating),
    description: book.review_text,
    link: book.link
  })) || [];

  return (
    <div className="space-y-12">
      {/* Main sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {mainSections.map((section) => (
          <ContentSection
            key={section.title}
            {...section}
          />
        ))}
      </div>

      <div className="h-px bg-gray-200 my-8" />

      {/* Recently Played */}
      <RecentPlays />

      <div className="h-px bg-gray-200 my-8" />

      {/* Book Feed */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">book feed</h2>
          <Link href="/book-feed" className="text-sm text-gray-500 hover:text-gray-700">
            SEE MORE
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {bookFeed.map((book) => (
            <ContentSection
              key={book.title}
              {...book}
            />
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-200 my-8" />

      {/* Star Feed */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">star feed</h2>
          <button className="text-sm text-gray-500 hover:text-gray-700">SEE MORE</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {starFeed.map((star) => (
            <ContentSection
              key={star.title}
              {...star}
            />
          ))}
        </div>
      </div>
    </div>
  );
}