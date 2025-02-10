import { Link } from "wouter";

type ContentType = "main" | "recent" | "book" | "star";

interface ContentSectionProps {
  title: string;
  subtitle: string;
  imageSrc: string;
  type?: ContentType;
  rating?: number;
  date?: string;
  author?: string;
  description?: string;
  excerpt?: string;
  url?: string;
  link?: string; // Added link prop
}

export function ContentSection({
  title,
  subtitle,
  imageSrc,
  type = "main",
  date,
  author,
  excerpt,
  url,
  link, // Added link prop
}: ContentSectionProps) {
  if (type === "main") {
    const content = (
      <div className="group relative aspect-[4/3]">
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <img
            src={imageSrc}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h3 className="text-xl font-bold font-slackey uppercase text-white mb-2">
            {title}
          </h3>
          <div className="inline-block px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold py-2 px-4 rounded">
            {subtitle}
          </div>
        </div>
      </div>
    );

    return link ? (
      <Link to={link} className="block cursor-pointer">
        {content}
      </Link>
    ) : (
      content
    );
  }

  if (type === "star") {
    return (
      <div className="group relative border rounded-lg shadow-sm">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="overflow-hidden rounded-t-lg bg-gray-200 aspect-[3/2]">
            <img
              src={imageSrc}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <div className="p-3">
            {author && (
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-gray-300"></div>
                <span className="text-sm text-gray-600">{author}</span>
                {date && (
                  <span className="text-sm text-gray-400">• {date}</span>
                )}
              </div>
            )}
            <h3 className="text-base font-bold mt-3 group-hover:text-blue-600 transition-colors">
              {title}
            </h3>
            {/* <p className="mt-1 text-sm text-gray-500">{subtitle}</p> */}
            {excerpt && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                {excerpt}
              </p>
            )}
          </div>
        </a>
      </div>
    );
  }

  return (
    <div className="group relative">
      <div
        className={`
          overflow-hidden rounded-lg bg-gray-200
          ${type === "recent" ? "aspect-[4/3]" : "aspect-[3/2]"}
        `}
      >
        <div className="h-full w-full bg-gray-300 transition-transform duration-300 group-hover:scale-105" />
      </div>
      <div className={`mt-4 ${type === "recent" ? "text-sm" : ""}`}>
        <h3 className="text-base font-bold">Uh-Oh</h3>
        <p className="mt-1 text-sm text-gray-500">maybe I'm loading?</p>
      </div>
    </div>
  );
}
