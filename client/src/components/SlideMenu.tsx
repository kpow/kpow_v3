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
  Code,
  Fish,
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
    { icon: <Home className="w-4 h-4" />, label: "home", href: "/" },
    { icon: <Info className="w-4 h-4" />, label: "about kpow", href: "/about" },
    { icon: <Fish className="w-4 h-4" />, label: "phashboard", href: "/stats" },
    {
      icon: <Star className="w-4 h-4" />,
      label: "star feed",
      href: "/starred-articles",
    },
    {
      icon: <Book className="w-4 h-4" />,
      label: "book feed",
      href: "/books",
    },
    {
      icon: <Youtube className="w-4 h-4" />,
      label: "youtube live",
      href: "/videos",
    },
    {
      icon: <Gamepad2 className="w-4 h-4" />,
      label: "hero battle",
      href: "/battle",
    },
    { icon: <Music className="w-4 h-4" />, label: "pmonk", href: "/pmonk" },
    {
      icon: <PlayCircle className="w-4 h-4" />,
      label: "itunes beta",
      href: "/itunes",
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: "gatsby version",
      href: "/gatsby",
      className: "text-blue-600",
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Menu */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-60 bg-white z-50 transform transition-transform duration-300 ease-out border-l border-gray-200",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="pt-20 px-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-sm transition-colors",
                item.className,
              )}
            >
              {item.icon}
              <span className="text-[13px]">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
