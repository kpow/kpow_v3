// One admin for the site: a side menu of sections, each at /admin/<section>.
// Add a section by adding an entry to SECTIONS.

import { Link, useRoute } from "wouter";
import { Book, Disc3, Video } from "lucide-react";
import { AlbumLookup } from "@/components/admin/AlbumLookup";
import { ITunesSearch } from "@/components/admin/iTunesSearch";
import { BookManager } from "@/components/admin/BookManager";
import { ShowsAdmin } from "@/components/admin/shows/ShowsAdmin";

function Music() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <AlbumLookup />
      </div>
      <div className="space-y-4">
        <ITunesSearch />
      </div>
    </div>
  );
}

const SECTIONS = [
  { id: "shows", label: "Shows", icon: Video, blurb: "k-shows nights, bands and venues", Component: ShowsAdmin },
  { id: "books", label: "Books", icon: Book, blurb: "Goodreads shelves and book entries", Component: BookManager },
  { id: "music", label: "Music", icon: Disc3, blurb: "Last.fm album lookup and iTunes search", Component: Music },
];

export default function AdminPage() {
  const [, params] = useRoute("/admin/:section");
  const current = SECTIONS.find((s) => s.id === params?.section) ?? SECTIONS[0];
  const { Component } = current;

  return (
    <div className="mt-4 flex flex-col gap-6 md:flex-row">
      <nav className="shrink-0 md:w-48">
        <h1 className="mb-3 px-2 font-slackey text-2xl">admin</h1>
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((s) => {
            const on = s.id === current.id;
            return (
              <li key={s.id}>
                <Link
                  href={`/admin/${s.id}`}
                  className={`flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                    on ? "bg-blue-600 font-semibold text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                  aria-current={on ? "page" : undefined}
                >
                  <s.icon className="h-4 w-4" />
                  {s.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <section className="min-w-0 flex-1">
        <p className="mb-4 text-sm text-gray-500">{current.blurb}</p>
        <Component />
      </section>
    </div>
  );
}
