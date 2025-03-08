import { useState, useEffect } from "react";
// import { Logo } from "./Logo";
import { SlideMenu } from "./SlideMenu";
import { Link } from "wouter";
import { ContactDialog } from "@/components/ContactDialog";
import MetallicPaint, {
  parseLogoImage,
} from "@/reactbits/MetallicPaint/MetallicPaint";
import { Wand2 } from "lucide-react";

import logo from "@/reactbits/skull-white.svg";
import Magnet from "@/reactbits/Magnet/Magnet";
import SplashCursor from "@/reactbits/SplashCursor/SplashCursor";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [imageData, setImageData] = useState<ImageData | null>(null);

  useEffect(() => {
    async function loadDefaultImage() {
      try {
        const response = await fetch(logo);
        const blob = await response.blob();
        const file = new File([blob], "default.png", { type: blob.type });
        const { imageData } = await parseLogoImage(file);
        setImageData(imageData);
      } catch (err) {
        console.error("Error loading default image:", err);
      }
    }

    loadDefaultImage();
  }, []);

  // Auto-disable SplashCursor after 10 seconds
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    if (showCursor) {
      timerId = setTimeout(() => {
        setShowCursor(false);
      }, 10000); // 10 seconds in milliseconds
    }

    // Cleanup function to clear the timer if component unmounts or showCursor changes
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [showCursor]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-95 text-white">
      {showCursor && <SplashCursor />}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link key="Home" href="/">
            <Magnet padding={6} disabled={false} magnetStrength={6}>
              <div className="flex items-center gap-2 group">
                <div className="w-[80px] h-[80px] bg-black rounded-full mt-2">
                  {imageData && (
                    <MetallicPaint
                      imageData={imageData}
                      params={{
                        edge: 5,
                        patternBlur: 0.5,
                        patternScale: 5,
                        refraction: 0.6,
                        speed: 0.25,
                        liquid: 1,
                      }}
                    />
                  )}
                </div>
                {/* <Logo /> */}
                <div className="flex items-center gap-2">
                  <div className="font-slackey text-2xl sm:text-3xl">kpow</div>
                  <button
                    onClick={() => setShowCursor(!showCursor)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Toggle cursor effects"
                  >
                    <Wand2
                      className={`animate-pulse w-5 h-5 ${showCursor ? "text-purple-400" : "text-gray-500"}`}
                    />
                  </button>
                </div>
              </div>
            </Magnet>
          </Link>
          <nav className="flex items-center gap-4">
            {/* Hide ContactDialog on mobile using Tailwind's responsive classes */}
            <div className="hidden md:block">
              <ContactDialog />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
              >
                <path d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </nav>
        </div>
      </div>

      <SlideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </header>
  );
}