import { useState, useEffect } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Home,
  Info,
  Star,
  Book,
  Youtube,
  Gamepad2,
  Music,
  PlayCircle,
  Code
} from "lucide-react";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SlideMenu({ isOpen, onClose }: SlideMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, label: "home", href: "/" },
    { icon: <Info className="w-5 h-5" />, label: "about kpow", href: "/about" },
    { icon: <Star className="w-5 h-5" />, label: "star feed", href: "/star-feed" },
    { icon: <Book className="w-5 h-5" />, label: "book feed", href: "/book-feed" },
    { icon: <Youtube className="w-5 h-5" />, label: "youtube live", href: "/youtube" },
    { icon: <Gamepad2 className="w-5 h-5" />, label: "hero battle", href: "/battle" },
    { icon: <Music className="w-5 h-5" />, label: "pmonk", href: "/pmonk" },
    { icon: <PlayCircle className="w-5 h-5" />, label: "itunes beta", href: "/itunes" },
    { icon: <Code className="w-5 h-5" />, label: "gatsby version", href: "/gatsby" }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />
      
      {/* Menu */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-64 bg-white z-50 transform transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-3 p-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
