// One lightbox for the whole section: hero, filmstrip and timeline photos all
// open the same overlay. Closes on backdrop click, the X, or Escape.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Shot {
  src: string;
  caption: string;
}

const LightboxContext = createContext<(shot: Shot) => void>(() => {});

export function useLightbox() {
  return useContext(LightboxContext);
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [shot, setShot] = useState<Shot | null>(null);
  const open = useCallback((next: Shot) => setShot(next), []);
  const close = useCallback(() => setShot(null), []);

  useEffect(() => {
    if (!shot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shot, close]);

  return (
    <LightboxContext.Provider value={open}>
      {children}
      {shot &&
        createPortal(
          <div
            className="buildlog-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label="Enlarged photo"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <button className="lightbox-close" aria-label="Close" onClick={close}>
              ×
            </button>
            <div className="lightbox-inner">
              <img src={shot.src} alt={shot.caption} />
              {shot.caption && (
                <div className="lightbox-cap">
                  <span className="dotmk">◆</span> <span>{shot.caption}</span>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </LightboxContext.Provider>
  );
}

/** A photo that opens the lightbox when clicked. */
export function Zoomable({
  src,
  caption,
  className,
}: {
  src: string;
  caption: string;
  className?: string;
}) {
  const open = useLightbox();
  return (
    <img
      src={src}
      alt={caption}
      loading="lazy"
      className={className}
      onClick={() => open({ src, caption })}
    />
  );
}
