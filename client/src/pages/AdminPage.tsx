// One admin for the site, dark so it's never mistaken for a public page.
// Routes: /admin/<section>, plus /admin/shows/<date> for one night. The public
// header stays; Layout.tsx skips its white card on /admin so this dark card
// takes its place. Add a section by adding an entry to SECTIONS.
// Design: ~/projects/showz/comps/admin/option-c-stage.html

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link, useRoute } from "wouter";
import { Book, ChevronDown, Disc3, Video } from "lucide-react";
import { AlbumLookup } from "@/components/admin/AlbumLookup";
import { ITunesSearch } from "@/components/admin/iTunesSearch";
import { BookManager } from "@/components/admin/BookManager";
import { ShowsAdmin } from "@/components/admin/shows/ShowsAdmin";
import { AdminChrome } from "@/components/admin/AdminChrome";


// The book and music tools were built for the light site; they sit on a light
// panel inside the dark admin until they get their own dark pass.
const Light = ({ children }: { children: ReactNode }) => (
  <div className="rounded-lg bg-white p-3 text-gray-900 sm:p-4" style={{ colorScheme: "light" }}>{children}</div>
);

const SECTIONS = [
  { id: "shows", label: "Shows", icon: Video, blurb: "k-shows nights, bands and venues" },
  { id: "books", label: "Books", icon: Book, blurb: "Goodreads shelves and book entries" },
  { id: "music", label: "Music", icon: Disc3, blurb: "Last.fm album lookup and iTunes search" },
];

export default function AdminPage() {
  const [, sec] = useRoute("/admin/:section");
  const [, night] = useRoute("/admin/shows/:date");
  const current = night ? SECTIONS[0] : SECTIONS.find((s) => s.id === sec?.section) ?? SECTIONS[0];
  const [crumb, setCrumb] = useState<ReactNode>(null);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);
  useEffect(() => setMenu(false), [current.id, night?.date]);

  return (
    <AdminChrome.Provider value={{ setCrumb }}>
      <div className="admin-dark mt-6 rounded-xl text-zinc-200">
        <div className="flex min-w-0 items-center gap-2 border-b border-zinc-800 px-3 py-3 sm:px-5 lg:px-6">
          <Link href="/admin/shows" className="shrink-0 font-slackey text-lg text-zinc-100">admin</Link>
          <span className="text-zinc-600">/</span>
          <div ref={menuRef} className="relative shrink-0">
            <button onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-zinc-100 ring-1 ring-zinc-800 hover:bg-zinc-800">
              <current.icon className="h-4 w-4" />{current.label}<ChevronDown className="h-4 w-4" />
            </button>
            {menu && (
              <div role="menu" className="absolute left-0 top-full z-30 mt-1 w-60 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl">
                {SECTIONS.map((s) => {
                  const on = s.id === current.id;
                  return (
                    <Link key={s.id} href={`/admin/${s.id}`} role="menuitem"
                      className={`flex items-start gap-2.5 rounded-md px-2.5 py-2 ${on ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800"}`}>
                      <s.icon className="mt-0.5 h-4 w-4" />
                      <span>
                        <span className="block text-sm font-semibold">{s.label}</span>
                        <span className={`block text-xs ${on ? "text-blue-100" : "text-zinc-500"}`}>{s.blurb}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
          <span className="flex min-w-0 flex-1 items-center gap-2">{crumb}</span>
        </div>
        <div className="px-3 py-4 sm:px-5 sm:py-5 lg:px-6">
          {current.id === "shows" && <ShowsAdmin date={night?.date} />}
          {current.id === "books" && <Light><BookManager /></Light>}
          {current.id === "music" && (
            <Light>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-4"><AlbumLookup /></div>
                <div className="space-y-4"><ITunesSearch /></div>
              </div>
            </Light>
          )}
        </div>
      </div>
    </AdminChrome.Provider>
  );
}
