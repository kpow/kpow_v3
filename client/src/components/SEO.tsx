import { HelmetProvider, Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

export function SEO({
  title = "KPOW - Into the Singularity",
  description = "A comprehensive cross-domain media and location analytics platform featuring an interactive Phish setlist guessing game that provides an engaging music trivia experience.",
  image = "/phash.jpg",
  url = typeof window !== "undefined" ? window.location.href : "",
  type = "website",
  keywords = "Phish, Music, Analytics, Donut Shops, Media Dashboard",
}: SEOProps) {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullImageUrl = image.startsWith("http") ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="utf-8" />
      <link rel="canonical" href={url} />
    </Helmet>
  );
}
