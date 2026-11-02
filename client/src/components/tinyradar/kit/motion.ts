// One switch for every moving thing in the tinyradar guide. It starts off when
// the reader asks for reduced motion; the ring playground has a button that
// turns it on anyway (their choice), and it can be paused from there too.

import { useEffect, useState, useSyncExternalStore } from "react";

const rm = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let on: boolean | null = null;
const subs = new Set<() => void>();

function get() {
  if (on === null) on = !rm();
  return on;
}

export function setMotion(v: boolean) {
  on = v;
  subs.forEach((f) => f());
}

export function useMotion(): [boolean, (v: boolean) => void] {
  const v = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    get,
    () => false,
  );
  return [v, setMotion];
}

/** True while the element is on screen (or near it). */
export function useOnScreen(ref: React.RefObject<Element | null>, margin = "120px") {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setVis(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setVis(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin]);
  return vis;
}

/** matchMedia as state. */
export function useMedia(q: string) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const f = () => setM(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, [q]);
  return m;
}
