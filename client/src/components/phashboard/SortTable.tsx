import { useMemo, useState, type ReactNode } from "react";
import { fmt, type Row } from "./data";

export interface Col {
  f: string;
  l: string;
  n?: boolean; // number: right-aligned, sorts descending first
  w?: boolean; // wide text column
  m?: boolean; // muted, small
  bar?: boolean; // in-cell bar on one shared scale
  render?: (v: any, r: Row) => ReactNode;
}

interface Props {
  rows: Row[];
  cols: Col[];
  rowKey: string;
  sort: [string, "asc" | "desc"];
  limit?: number;
  selected?: string | null;
  onRow?: (key: string, row: Row) => void;
  rowClass?: (r: Row) => string | undefined;
}

export function SortTable({ rows, cols, rowKey, sort, limit, selected, onRow, rowClass }: Props) {
  const [s, setS] = useState(sort);
  const data = useMemo(() => {
    const [f, dir] = s;
    const out = [...rows].sort((a, b) => {
      const x = a[f], y = b[f];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
      return dir === "asc" ? c : -c;
    });
    return limit ? out.slice(0, limit) : out;
  }, [rows, s, limit]);
  const max = useMemo(() => {
    const m: Record<string, number> = {};
    cols.filter((c) => c.bar).forEach((c) => { m[c.f] = Math.max(1, ...rows.map((r) => Number(r[c.f]) || 0)); });
    return m;
  }, [rows, cols]);

  return (
    <table>
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.f} className={c.n ? "n" : undefined} aria-sort={s[0] === c.f ? (s[1] === "asc" ? "ascending" : "descending") : "none"}>
              <button type="button" onClick={() => setS(s[0] === c.f ? [c.f, s[1] === "asc" ? "desc" : "asc"] : [c.f, c.n ? "desc" : "asc"])}>
                {c.l}{s[0] === c.f ? (s[1] === "asc" ? " ↑" : " ↓") : ""}
              </button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((r) => {
          const k = String(r[rowKey]);
          const cls = [onRow ? "click" : "", selected === k ? "sel" : "", rowClass?.(r) ?? ""].filter(Boolean).join(" ");
          return (
            <tr key={k} className={cls || undefined} tabIndex={onRow ? 0 : undefined}
              onClick={onRow ? () => onRow(k, r) : undefined}
              onKeyDown={onRow ? (e) => { if (e.key === "Enter") onRow(k, r); } : undefined}>
              {cols.map((c) => {
                const v = r[c.f];
                return (
                  <td key={c.f} className={c.n ? "n" : c.w ? "w" : c.m ? "m" : undefined}>
                    {c.bar && Number(v) > 0 && <span className="bar" style={{ width: Math.max(2, (Number(v) / max[c.f]) * 56) }} />}
                    {c.render ? c.render(v, r) : fmt(v)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
