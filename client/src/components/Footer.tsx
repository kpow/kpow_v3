import { Twitter, Instagram, Github } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* About Section */}
          <div className="flex items-start gap-4 max-w-md">
            <div className="mt-1">
              <Logo />
            </div>
            <div>
              <h3 className="font-bold mb-2">About Kpow</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Digital Architect - Leader - Developer - Pixel Farmer - 
                Voracious Reader and Dad. I'm into travel, ukes, pugs, live music, and pixels.
              </p>
            </div>
          </div>

          {/* Site Info Section */}
          <div className="max-w-md">
            <h3 className="font-bold mb-2">Site</h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              This is a JAMstack site built with Next.js, React.js, Material-UI, React-Query, and some content in Markdown. Using Instagram, GoodReads, Feedbin, Unsplash, faviconkit and whatever other API's I'm playing with :)
            </p>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-center space-x-6">
            <a 
              href="https://twitter.com/kpow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a 
              href="https://instagram.com/kpow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-pink-400 transition-colors"
            >
              <Instagram className="w-5 h-5" />
            </a>
            <a 
              href="https://github.com/kpow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-400 transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
          <div className="mt-4 text-center text-sm text-gray-400">
            © {currentYear} KPOW. All rights reserved.
          </div>
      </div>
    </footer>
  );
}