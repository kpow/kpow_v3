import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/** A div that d3 draws into, redrawn when its width or deps change. */
export function Chart({ draw, deps, minHeight = 240, style, className }: {
  draw: (el: HTMLDivElement) => void;
  deps: unknown[];
  minHeight?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (ref.current && w > 0) draw(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, ...deps]);
  return <div ref={ref} className={`pb-chart ${className ?? ""}`} style={{ minHeight, ...style }} />;
}

export function Legend({ items }: { items: [string, string][] }) {
  return (
    <div className="pb-legend">
      {items.map(([label, color]) => (
        <span key={label}><i style={{ background: color }} />{label}</span>
      ))}
    </div>
  );
}

export function Kpi({ label, value, sub, dark }: { label: string; value: ReactNode; sub?: ReactNode; dark?: boolean }) {
  return (
    <div className={`pb-kpi${dark ? " dark" : ""}`}>
      <span className="eb">{label}</span>
      <span className="num">{value}</span>
      {sub && <span className="sub">{sub}</span>}
    </div>
  );
}

export function Card({ id, eb, title, note, wide, dark, children, h = 2 }: {
  id?: string; eb?: string; title?: ReactNode; note?: ReactNode; wide?: boolean; dark?: boolean; children?: ReactNode; h?: 2 | 3;
}) {
  return (
    <div id={id} className={`pb-card${wide ? " wide" : ""}${dark ? " dark" : ""}`}>
      {eb && <span className="eb">{eb}</span>}
      {title && (h === 2 ? <h2>{title}</h2> : <h3>{title}</h3>)}
      {note && <p className="note">{note}</p>}
      {children}
    </div>
  );
}

export const Loading = ({ what = "loading" }: { what?: string }) => <div className="pb-loading">{what}…</div>;
export const Failed = ({ error }: { error: unknown }) => (
  <div className="pb-loading">couldn't load this: {error instanceof Error ? error.message : "unknown error"}</div>
);
