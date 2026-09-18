// Body fields in builds.json are markdown (inline code, bold, lists, headings).
// Links open in a new tab; everything else picks up the scoped .buildlog styles.

import ReactMarkdown from "react-markdown";

export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={className ? `md ${className}` : "md"}>
      <ReactMarkdown
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
