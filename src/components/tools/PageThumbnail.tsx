import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { renderPage } from "@/lib/pdf-browser";

export function PageThumbnail({
  doc,
  index,
  rotation,
}: {
  doc: PDFDocumentProxy;
  index: number;
  rotation: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const controller = new AbortController();
    let started = false;
    let promise: Promise<void> = Promise.resolve();
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting) || started) return;
        started = true;
        observer.disconnect();
        promise = (async () => {
          const page = await doc.getPage(index + 1);
          const viewport = page.getViewport({ scale: 1 });
          await renderPage(
            doc,
            index,
            element,
            160 / Math.max(viewport.width, viewport.height),
            controller.signal,
            rotation,
          );
          if (!controller.signal.aborted) setReady(true);
        })().catch(() => {
          if (!controller.signal.aborted) setError(true);
        });
      },
      { rootMargin: "100px" },
    );
    observer.observe(element.parentElement!);
    return () => {
      observer.disconnect();
      controller.abort();
      void promise.finally(() => {
        element.width = element.height = 0;
      });
    };
  }, [doc, index, rotation]);
  return (
    <div
      aria-busy={!ready && !error}
      className="flex h-44 items-center justify-center rounded-lg bg-white p-2"
    >
      {error ? (
        <span className="text-xs text-red-700">Preview unavailable</span>
      ) : (
        <canvas
          ref={canvas}
          aria-label={`Preview of page ${index + 1}`}
          className="max-h-40 max-w-full"
        />
      )}
    </div>
  );
}
