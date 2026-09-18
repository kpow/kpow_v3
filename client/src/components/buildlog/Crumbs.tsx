import { Link } from "wouter";

export function Crumbs({ here }: { here?: string }) {
  return (
    <div className="crumbs">
      {here ? <Link href="/builds">build log</Link> : <span>build log</span>}
      {here && (
        <>
          <span className="sep">/</span>
          <span>{here}</span>
        </>
      )}
    </div>
  );
}
