// The section wrapper. `.buildlog` is what scopes the gemtone-purple tokens to
// this section — the rest of kpow.xyz keeps its blue accent. No header or footer
// here: the Build Log is page content inside the site's existing Layout.

import "./buildlog.css";
import { LightboxProvider } from "./Lightbox";

export function BuildLogShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="buildlog">
      <LightboxProvider>{children}</LightboxProvider>
    </div>
  );
}

export function BuildLogLoading({ label = "loading build log…" }: { label?: string }) {
  return (
    <div className="py-16 text-center text-sm text-gray-400 font-mono">{label}</div>
  );
}

export function BuildLogError({ message }: { message: string }) {
  return (
    <div className="py-16 text-center text-sm text-gray-500">
      <p className="font-bold text-gray-700">Couldn&rsquo;t load the build log.</p>
      <p className="mt-1 font-mono text-xs text-gray-400">{message}</p>
    </div>
  );
}
