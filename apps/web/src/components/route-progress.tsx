"use client";
import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Global navigation progress bar.
 *
 * App Router keeps the current page on screen until the next one is ready, so a
 * bar that only reacts to a pathname change would appear *after* the wait. To
 * give feedback during the wait we start the bar the moment an internal link is
 * clicked (capture-phase listener) and finish it when the route actually
 * commits (pathname/search change). A programmatic `startNavigation()` is also
 * exported for router.push() callers.
 */

let externalStart: (() => void) | null = null;
/** Trigger the bar manually before a router.push(). */
export function startNavigation() {
  externalStart?.();
}

export function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [pending, setPending] = React.useState(false);
  const [width, setWidth] = React.useState(0);

  // Begin on any internal anchor click (Link renders an <a>).
  React.useEffect(() => {
    const begin = () => setPending(true);
    externalStart = begin;

    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      const target = anchor.getAttribute("target");
      if (!href || href.startsWith("#") || target === "_blank") return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) return; // external
        if (url.pathname === window.location.pathname && url.search === window.location.search)
          return; // same page
        begin();
      } catch {
        /* ignore malformed href */
      }
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      externalStart = null;
    };
  }, []);

  // The route committed → finish.
  React.useEffect(() => {
    setPending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, search]);

  // Animate: creep toward 90% while pending, snap to 100% and fade out when done.
  React.useEffect(() => {
    if (pending) {
      setWidth(8);
      let w = 8;
      const id = setInterval(() => {
        w = Math.min(90, w + (90 - w) * 0.18);
        setWidth(w);
      }, 180);
      return () => clearInterval(id);
    }
    setWidth((w) => (w === 0 ? 0 : 100));
    const t = setTimeout(() => setWidth(0), 280);
    return () => clearTimeout(t);
  }, [pending]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-[3px]">
      <div
        className="h-full rounded-r-full bg-primary shadow-[0_0_10px_1px] shadow-primary transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${width}%`, opacity: width === 0 ? 0 : 1 }}
      />
    </div>
  );
}
