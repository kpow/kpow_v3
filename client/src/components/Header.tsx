import { useState } from "react";
import { Logo } from "./Logo";
import { SlideMenu } from "./SlideMenu";
import { Link } from "wouter";
import { ContactDialog } from "./ContactDialog";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-95 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link key="Home" href="/">
             <div className="hover:animate-shake">
              <div className="flex items-center gap-2 group">
             
                <Logo />
                <div className="font-slackey text-2xl sm:text-3xl">kpow</div>
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-4">
            <ContactDialog />
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
