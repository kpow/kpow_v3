// A row of bordered picture cards, one per step: a picture (the round screen,
// a phone, a photo) over a number, a title and one line. On wide screens they
// sit side by side with arrows between; narrower, they swipe sideways with dots.

import { useRef, useState, type ReactNode } from "react";
import { Rich } from "@/components/vizbot/bits";
import { cn } from "@/lib/utils";

export interface Board {
  stage: ReactNode;
  /** dark = the radar's own colours behind it; top = the picture hangs from the top (phones); photo = edge to edge */
  bg?: "light" | "dark" | "top" | "photo";
  tag?: { text: string; purple?: boolean };
  title: string;
  body: string;
}

export function StepBoard({ items, label }: { items: Board[]; label: string }) {
  const ref = useRef<HTMLOListElement>(null);
  const [on, setOn] = useState(0);
  const n = items.length;

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const mid = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    cards.forEach((c, i) => {
      if (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - mid))
        best = i;
    });
    setOn(best);
  };

  const go = (i: number) => {
    const el = ref.current;
    const c = el?.children[i] as HTMLElement | undefined;
    if (!el || !c) return;
    el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <ol ref={ref} className="sb-board m-0 list-none" style={{ ["--n" as string]: n }} aria-label={label} onScroll={onScroll}>
        {items.map((it, i) => (
          <li key={it.title} className="sb-card">
            <div
              className={cn(
                "sb-stage",
                it.bg === "dark" && "dk",
                it.bg === "top" && "top",
                it.bg === "photo" && "photo",
              )}
            >
              {it.tag ? <span className={cn("sb-tag", it.tag.purple && "p")}>{it.tag.text}</span> : null}
              {it.stage}
            </div>
            <div className="sb-body">
              <span className="tr-num sb-num" aria-hidden="true">
                {i + 1}
              </span>
              <h3>
                <span className="sr-only">Step {i + 1}: </span>
                {it.title}
              </h3>
              <p>
                <Rich text={it.body} />
              </p>
            </div>
          </li>
        ))}
      </ol>
      {items.slice(1).map((_, i) => {
        const k = i + 1;
        return (
          <span key={k} className="sb-arrow" style={{ left: `calc(${(k / n) * 100}% + ${(14 * k) / n - 7}px)` }} aria-hidden="true">
            ›
          </span>
        );
      })}
      <div className="sb-dots" role="tablist" aria-label={`${label}: pick a card`}>
        {items.map((it, i) => (
          <button
            key={it.title}
            type="button"
            role="tab"
            aria-selected={on === i}
            aria-label={`Step ${i + 1}: ${it.title}`}
            className={cn(on === i && "on")}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
