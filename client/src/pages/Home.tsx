import { ContentSection } from "@/components/ContentSection";
import RecentlyPlayed from "@/components/RecentlyPlayed";

export default function Home() {
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

  const bookFeed = [
    {
      title: "How to Live Safely in a Science Fictional Universe",
      subtitle: "by Charles Yu",
      imageSrc: "/placeholder-book.png",
      type: 'book' as const,
      rating: 4,
      description: "A story of a son searching for his father ... through quantum space-time."
    },
    {
      title: "The Society of Unknowable Objects",
      subtitle: "by Neil Gaiman",
      imageSrc: "/placeholder-book.png",
      type: 'book' as const,
      rating: 5,
      description: "From the author of the internationally bestselling The Book of Doors, another fantastical journey into a world where the boundaries between everyday people are members of a secret society tasked with finding and protecting hidden magical objects."
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
      <RecentlyPlayed />

      <div className="h-px bg-gray-200 my-8" />

      {/* Book Feed */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold font-slackey">book feed</h2>
          <button className="text-sm text-gray-500 hover:text-gray-700">SEE MORE</button>
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