// One lightbox for the whole section: hero, filmstrip and devlog photos all
// open the same overlay. It opens on a gallery (an entry's media, the WIP Pix
// sheet) and steps through it with ‹ › or the arrow keys. Closes on backdrop
// click, the X, or Escape.
// .mp4/.webm media plays as a looping <video> with controls, the poster shown
// until it loads.
//
// A caption is optional — it exists only when it carries something the photo
// can't. `alt` is required and never visible: it keeps every image named for
// screen readers whether or not there's a caption. Media that needs to say what
// it is gets a badge instead of caption text: video off the extension, stills
// off `kind`.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { MediaKind } from "@/lib/buildlog";

export interface Shot {
  src: string;
  alt: string;
  caption?: string;
  poster?: string;
  kind?: MediaKind;
}

export const isVideo = (src: string) => /\.(mp4|webm)$/i.test(src);

/** What to show when a video isn't playing: its poster. */
export const still = (shot: { src: string; poster?: string }) => (isVideo(shot.src) ? shot.poster || "" : shot.src);

function badgeFor(src: string, kind?: MediaKind) {
  return isVideo(src) ? "video" : kind;
}

type Open = (shots: Shot[], index?: number) => void;

const LightboxContext = createContext<Open>(() => {});

export function useLightbox() {
  return useContext(LightboxContext);
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{ shots: Shot[]; i: number } | null>(null);
  const open = useCallback<Open>((shots, index = 0) => setState({ shots, i: index }), []);
  const close = useCallback(() => setState(null), []);
  const step = useCallback(
    (d: number) => setState((s) => s && { ...s, i: (s.i + d + s.shots.length) % s.shots.length }),
    [],
  );

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [state, close, step]);

  const shot = state?.shots[state.i];
  const many = !!state && state.shots.length > 1;

  return (
    <LightboxContext.Provider value={open}>
      {children}
      {state &&
        shot &&
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
            {many && (
              <button className="lb-nav prev" aria-label="Previous" onClick={() => step(-1)}>
                ‹
              </button>
            )}
            <div className="lightbox-inner">
              {isVideo(shot.src) ? (
                <video
                  key={shot.src}
                  src={shot.src}
                  poster={shot.poster}
                  controls
                  autoPlay
                  loop
                  playsInline
                  aria-label={shot.alt}
                />
              ) : (
                <img key={shot.src} src={shot.src} alt={shot.alt} />
              )}
              {(shot.caption || many) && (
                <div className="lightbox-cap">
                  <span className="dotmk">◆</span> <span className="lb-cap">{shot.caption}</span>
                  {many && (
                    <span className="lb-count">
                      {state.i + 1} / {state.shots.length}
                    </span>
                  )}
                </div>
              )}
            </div>
            {many && (
              <button className="lb-nav next" aria-label="Next" onClick={() => step(1)}>
                ›
              </button>
            )}
          </div>,
          document.body,
        )}
    </LightboxContext.Provider>
  );
}

/** A photo or looping video that opens the lightbox when clicked. Only the hero
 *  uses it now; everything else is a MediaTile. */
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
  const zoom = () => open([{ src, alt: label, caption, poster, kind }]);

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

/** One item of a gallery as a still: a video shows its poster and a play
 *  button instead of autoplaying. Opens the lightbox at this item. */
export function MediaTile({
  gallery,
  index,
  className,
  num,
  children,
}: {
  gallery: Shot[];
  index: number;
  className?: string;
  /** A small position marker, e.g. "2" in a mosaic. */
  num?: string;
  /** An overlay (the mosaic's "+N more"); replaces the badge. */
  children?: React.ReactNode;
}) {
  const open = useLightbox();
  const shot = gallery[index];
  const video = isVideo(shot.src);
  const badge = badgeFor(shot.src, shot.kind);

  return (
    <button
      type="button"
      className={`tile${video ? " is-video" : ""}${className ? ` ${className}` : ""}`}
      aria-label={shot.caption || shot.alt}
      onClick={() => open(gallery, index)}
    >
      <img src={still(shot)} alt="" loading="lazy" />
      {video && <span className="play" aria-hidden="true" />}
      {badge && !children && <span className="media-badge">{badge}</span>}
      {num && <span className="tile-num">{num}</span>}
      {children}
    </button>
  );
}
