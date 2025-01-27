import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container max-w-6xl mx-auto px-4 flex gap-8 justify-between">
        {/* About Section */}
        <div className="flex items-start gap-4 max-w-sm">
          <div className="flex-shrink-0">
            <img
              src="/kpow_avatar.jpg"
              alt="Kpow"
              className="w-12 h-12 rounded-full"
            />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-1">About kpow</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              Digital Architect - Leader - Developer - Pixel Farmer.
              <br />
              Voracious Reader and Dad. I'm into travel, ukes, pugs, live music,
              and pixels.
            </p>
          </div>
        </div>

        {/* Site Info Section */}
        <div className="max-w-md">
          <h3 className="text-xl font-bold mb-1">Site</h3>
          <p className="text-sm text-gray-300 leading-relaxed">
            This is a JAMstack site built with Next.js, React.js, Material-UI, React-Query, and some content in Markdown. Using Instagram, GoodReads, Feedbin, Unsplash, faviconkit and whatever other API's I'm playing with :)
          </p>
        </div>
      </div>
    </footer>
  );
}