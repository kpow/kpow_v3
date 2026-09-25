import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
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
  Code,
  Fish,
  Circle,
  Mail,
  Lightbulb,
  AudioLines,
  Hammer,
  Bot,
  Disc3,
  Rss,
  History,
  ChevronDown,
} from "lucide-react";
import { ContactDialog } from "@/components/ContactDialog";

interface SlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavLink {
  icon: ReactNode;
  label: string;
  href: string;
  /** Path prefixes that count as "here" for this link */
  match?: string[];
  external?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  icon: ReactNode;
  links: NavLink[];
}

const TOP: NavLink[] = [
  { icon: <Home className="w-4 h-4" />, label: "home", href: "/" },
  { icon: <Info className="w-4 h-4" />, label: "about kpow", href: "/about" },
];

// Sections with their own sub-nav (build log, vizBot, vizSpot) link to their
// landing page only. The menu stays short and the section menus do the rest.
const GROUPS: NavGroup[] = [
  {
    id: "builds",
    label: "builds",
    icon: <Hammer className="w-4 h-4" />,
    links: [
      { icon: <Hammer className="w-4 h-4" />, label: "build log", href: "/builds", match: ["/builds"] },
      { icon: <Bot className="w-4 h-4" />, label: "vizBot", href: "/vizbot", match: ["/vizbot"] },
      { icon: <AudioLines className="w-4 h-4" />, label: "vizSpot", href: "/vizspot/guide", match: ["/vizspot"] },
      { icon: <Lightbulb className="w-4 h-4" />, label: "led art", href: "/led", match: ["/led"] },
    ],
  },
  {
    id: "music",
    label: "music",
    icon: <Disc3 className="w-4 h-4" />,
    links: [
      { icon: <Fish className="w-4 h-4" />, label: "phashboard", href: "/phashboard", match: ["/phashboard"] },
      { icon: <Music className="w-4 h-4" />, label: "pmonk", href: "/pmonk", match: ["/pmonk"] },
      { icon: <Music className="w-4 h-4" />, label: "itunez", href: "/itunez", match: ["/itunez"] },
    ],
  },
  {
    id: "feeds",
    label: "feeds",
    icon: <Rss className="w-4 h-4" />,
    links: [
      { icon: <Star className="w-4 h-4" />, label: "star feed", href: "/starred-articles", match: ["/starred-articles"] },
      { icon: <Book className="w-4 h-4" />, label: "book feed", href: "/books", match: ["/books"] },
      { icon: <Youtube className="w-4 h-4" />, label: "youtube live", href: "/videos", match: ["/videos"] },
    ],
  },
  {
    id: "play",
    label: "play",
    icon: <Gamepad2 className="w-4 h-4" />,
    links: [
      { icon: <Gamepad2 className="w-4 h-4" />, label: "hero battle", href: "/battle", match: ["/battle"] },
      { icon: <Circle className="w-4 h-4" />, label: "donut tour", href: "/donut-tour", match: ["/donut-tour"] },
    ],
  },
  {
    id: "old",
    label: "old sites",
    icon: <History className="w-4 h-4" />,
    links: [
      { icon: <Code className="w-4 h-4" />, label: "gatsby version", href: "https://gatsby.kpow-wow.com/", external: true },
      { icon: <Code className="w-4 h-4" />, label: "next.js version", href: "https://kpow-wow.com/", external: true },
      { icon: <Code className="w-4 h-4" />, label: "2012 version", href: "http://2012.kpow.com/#/home", external: true },
    ],
  },
];

const isHere = (link: NavLink, path: string) =>
  link.href === "/" ? path === "/" : (link.match ?? [link.href]).some((m) => path === m || path.startsWith(m + "/"));

const groupFor = (path: string) => GROUPS.find((g) => g.links.some((l) => isHere(l, path)))?.id ?? null;

const rowCls = "flex items-center gap-3 py-2 px-3 text-gray-700 hover:bg-gray-50 rounded-sm transition-colors";

export function SlideMenu({ isOpen, onClose }: SlideMenuProps) {
  const [mounted, setMounted] = useState(false);
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  // One group open at a time; the group holding the current page opens by itself
  const [openGroup, setOpenGroup] = useState<string | null>(() => groupFor(location));

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

  useEffect(() => {
    if (isOpen) setOpenGroup(groupFor(location));
  }, [isOpen, location]);

  if (!mounted) return null;

  const renderLink = (item: NavLink, nested = false) => {
    const here = !item.external && isHere(item, location);
    const cls = cn(
      rowCls,
      nested && "py-1.5",
      here && "bg-gray-100 font-medium text-gray-900",
      item.external && "text-blue-600",
    );
    const body = (
      <>
        {item.icon}
        <span className="text-[13px]">{item.label}</span>
      </>
    );
    return item.external ? (
      <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" onClick={onClose} className={cls}>
        {body}
      </a>
    ) : (
      <Link key={item.label} href={item.href} onClick={onClose} className={cls} aria-current={here ? "page" : undefined}>
        {body}
      </Link>
    );
  };

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
          "fixed top-0 right-0 h-full w-60 bg-white z-50 transform transition-transform duration-300 ease-out border-l border-gray-200 overflow-y-auto overscroll-contain",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <nav className="pt-20 pb-8 px-4 space-y-1">
          {/* Contact Dialog for mobile - only shown in mobile view */}
          <div className="md:hidden mb-2">
            <div
              className={rowCls}
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

          {TOP.map((item) => renderLink(item))}

          <div className="my-2 border-t border-gray-100" />

          {GROUPS.map((g) => {
            const open = openGroup === g.id;
            return (
              <div key={g.id}>
                <button
                  type="button"
                  onClick={() => setOpenGroup(open ? null : g.id)}
                  aria-expanded={open}
                  aria-controls={`nav-${g.id}`}
                  className={cn(rowCls, "w-full text-left")}
                >
                  {g.icon}
                  <span className="text-[13px] font-medium">{g.label}</span>
                  <ChevronDown
                    className={cn("ml-auto w-3.5 h-3.5 text-gray-400 transition-transform", open && "rotate-180")}
                  />
                </button>
                {open && (
                  <div id={`nav-${g.id}`} className="mb-1 ml-[1.35rem] border-l border-gray-200 pl-1.5">
                    {g.links.map((l) => renderLink(l, true))}
                  </div>
                )}
              </div>
            );
          })}

          {user && (
            <>
              <div className="my-2 border-t border-gray-100" />
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
              <Link key="admin" href="/admin" onClick={onClose} className={rowCls}>
                <span className="text-[13px]">admin</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </>
  );
}
