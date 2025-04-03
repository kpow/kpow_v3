import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Wand2, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  Circle,
  Mail,
} from "lucide-react";
import { ContactDialog } from "@/components/ContactDialog";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SlideMenu({ isOpen, onClose }: SlideMenuProps) {
  const [mounted, setMounted] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        setLocation("/auth");
      },
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const menuItems = [
    { icon: <Home className="w-4 h-4" />, label: "home", href: "/" },
    { icon: <Info className="w-4 h-4" />, label: "about kpow", href: "/about" },
    {
      icon: <Fish className="w-4 h-4" />,
      label: "phashboard",
      href: "/phashboard",
    },
    {
      icon: <Gamepad2 className="w-4 h-4" />,
      label: "hero battle",
      href: "/battle",
    },
    {
      icon: <Youtube className="w-4 h-4" />,
      label: "youtube live",
      href: "/videos",
    },
    { icon: <Music className="w-4 h-4" />, label: "pmonk", href: "/pmonk" },
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
      icon: <Circle className="w-4 h-4" />,
      label: "donut tour",
      href: "/donut-tour",
    },
    {
      icon: <Music className="w-4 h-4" />,
      label: "itunez",
      href: "/itunez",
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: "gatsby version",
      href: "https://gatsby.kpow-wow.com/",
      className: "text-blue-600",
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: "next.js version",
      href: "https://kpow-wow.com/",
      className: "text-blue-600",
    },
    {
      icon: <Code className="w-4 h-4" />,
      label: "2012 version",
      href: "http://2012.kpow.com/#/home",
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
          {/* Contact Dialog for mobile - only shown in mobile view */}
          <div className="md:hidden mb-2">
            <div
              className="flex items-center gap-3 py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-sm transition-colors"
              onClick={(e) => {
                e.stopPropagation(); // Prevent closing the slide menu when clicking the contact button
              }}
            >
              <Mail className="w-4 h-4" />
              <span className="text-[13px]">
                <ContactDialog />
              </span>
            </div>
          </div>

          {menuItems.map((item) =>
            item.href.startsWith("http") ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-sm transition-colors",
                  item.className,
                )}
              >
                {item.icon}
                <span className="text-[13px]">{item.label}</span>
              </a>
            ) : (
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
            ),
          )}
          {user && (
        <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="text-black hover:text-white hover:bg-white/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          <Link
            key="admin"
            href="/admin"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 py-2.5 px-3 text-gray-700 hover:bg-gray-50 rounded-sm transition-colors"
            )}
          >
            <span className="text-[13px]">admin</span>
          </Link>
        
          </>
          )}
        </nav>
      </div>
    </>
  );
}
