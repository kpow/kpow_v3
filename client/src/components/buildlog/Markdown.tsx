// Body fields in builds.json are markdown: CommonMark plus GFM (tables,
// strikethrough, task lists, autolinks). Links open in a new tab; a table gets
// its own scroll box so a wide one never widens the page on a phone. Everything
// else picks up the scoped .buildlog .md styles.

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Module scope on purpose: a fresh array or object each render re-runs the
// whole markdown pipeline.
const REMARK_PLUGINS = [remarkGfm];

const COMPONENTS: Components = {
  a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
  table: ({ node, ...props }) => (
    <div className="md-table-wrap">
      <table {...props} />
    </div>
  ),
};

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ? `md ${className}` : "md"}>
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
