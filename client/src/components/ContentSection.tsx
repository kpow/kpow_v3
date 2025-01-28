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
}

export function ContentSection({
  title,
  subtitle,
  imageSrc,
  type = "main",
  rating,
  date,
  author,
  description,
  excerpt,
  url,
}: ContentSectionProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={`text-sm ${i < rating ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (type === "book") {
    return (
      <div className="group flex gap-6">
        <div className="w-[120px] flex-shrink-0">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-200">
            <div className="h-full w-full bg-gray-300 transition-transform duration-300 group-hover:scale-105" />
          </div>
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          {rating !== undefined && (
            <div className="mt-2">{renderStars(rating)}</div>
          )}
          {description && (
            <p className="mt-3 text-sm text-gray-500 line-clamp-6">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (type === "main") {
    return (
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
          <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-sm rounded text-sm text-white">
            {subtitle}
          </div>
        </div>
      </div>
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
                <div className="h-6 w-6 rounded-full bg-gray-300">
                  <img
                    alt="favicon"
                    src={`https://api.faviconkit.com/${url}/35`}
                  />
                </div>
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
        <h3 className="text-base font-bold">{title}</h3>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}
