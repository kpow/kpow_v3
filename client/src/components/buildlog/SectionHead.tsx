export function SectionHead({ title, count }: { title: string; count?: string }) {
  return (
    <div className="section-head">
      <h2>{title}</h2>
      {count && <span className="count">{count}</span>}
      <span className="rule" />
    </div>
  );
}
