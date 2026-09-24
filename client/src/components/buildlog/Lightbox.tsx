// One lightbox for the whole section: hero, filmstrip and timeline photos all
// open the same overlay. Closes on backdrop click, the X, or Escape.
// .mp4/.webm media plays as a looping muted <video> (same attributes as the
// LED Art hero), with the poster still shown until it loads.
//
// A caption is optional — it exists only when it carries something the photo
// can't. `alt` is required and never visible: it keeps every image named for
// screen readers whether or not there's a caption. Media that needs to say what
// it is gets a badge instead of caption text: video off the extension, stills
// off `kind`.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaKind } from "@/lib/buildlog";

interface Shot {
  src: string;
  alt: string;
  caption?: string;
  poster?: string;
  kind?: MediaKind;
}

const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src);

function badgeFor(src: string, kind?: MediaKind) {
  return isVideo(src) ? "video" : kind;
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
            aria-label={isVideo(shot.src) ? "Enlarged video" : "Enlarged photo"}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <button className="lightbox-close" aria-label="Close" onClick={close}>
              ×
            </button>
            <div className="lightbox-inner">
              {isVideo(shot.src) ? (
                <video
                  src={shot.src}
                  poster={shot.poster}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  aria-label={shot.alt}
                />
              ) : (
                <img src={shot.src} alt={shot.alt} />
              )}
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

/** A photo or video that opens the lightbox when clicked. */
export function Zoomable({
  src,
  alt,
  caption,
  poster,
  kind,
  className,
}: {
  src: string;
  /** Never rendered on screen. Required so no call site can drop the accessible name. */
  alt: string;
  caption?: string;
  poster?: string;
  kind?: MediaKind;
  className?: string;
}) {
  const open = useLightbox();
  const label = caption || alt;
  const badge = badgeFor(src, kind);
  const zoom = () => open({ src, alt: label, caption, poster, kind });

  return (
    <span className="media-wrap">
      {isVideo(src) ? (
        <video
          src={src}
          poster={poster}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={label}
          className={className}
          onClick={zoom}
        />
      ) : (
        <img src={src} alt={label} loading="lazy" className={className} onClick={zoom} />
      )}
      {badge && <span className="media-badge">{badge}</span>}
    </span>
  );
}
