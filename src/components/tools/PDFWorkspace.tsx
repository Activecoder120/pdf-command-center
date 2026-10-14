import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { ArrowDown, ArrowUp, Download, RotateCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UploadZone } from "./UploadZone";
import { PageThumbnail } from "./PageThumbnail";
import { fileSize, validateBatch, validateUpload } from "@/lib/upload";
import { openPreview, processFiles } from "@/lib/pdf-browser";
import { defaultOptions } from "@/lib/pdf-types";
import type { PdfOptions } from "@/lib/pdf-types";
import { moveItem } from "@/lib/order";

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";
type Result = { name: string; url: string; size: number };

export function PDFWorkspace({ slug }: { slug: string }) {
  const initial = {
    ...defaultOptions,
    fontSize: slug === "page-numbers" ? 12 : defaultOptions.fontSize,
    imageFormat: slug === "pdf-to-jpg" ? ("jpeg" as const) : ("png" as const),
  };
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<PdfOptions>(initial);
  const [doc, setDoc] = useState<PDFDocumentProxy>();
  const [busy, setBusy] = useState(false);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState<{ completed: number; total: number }>();
  const [results, setResults] = useState<Result[]>([]);
  const resultRefs = useRef<Result[]>([]);
  const job = useRef<AbortController | undefined>(undefined);
  const validation = useRef(0);
  const dragFile = useRef<number | undefined>(undefined);
  const dragPage = useRef<number | undefined>(undefined);
  const images = slug === "jpg-to-pdf";
  const multiple = slug === "merge" || images;
  const pageEditor = ["rotate", "organize", "delete"].includes(slug);
  const preview =
    pageEditor || ["split", "watermark", "page-numbers", "pdf-to-jpg", "pdf-to-png"].includes(slug);
  const disabled = busy || validating || loading;

  const clearResults = () => {
    for (const result of resultRefs.current) URL.revokeObjectURL(result.url);
    resultRefs.current = [];
    setResults([]);
  };
  const change = <K extends keyof PdfOptions>(key: K, value: PdfOptions[K]) => {
    clearResults();
    setNotice("");
    setOptions((current) => ({ ...current, [key]: value }));
  };
  useEffect(
    () => () => {
      validation.current++;
      job.current?.abort();
      for (const result of resultRefs.current) URL.revokeObjectURL(result.url);
    },
    [],
  );
  useEffect(() => {
    setDoc(undefined);
    setOptions((current) => ({ ...current, pages: [] }));
    if (!preview || !files[0]) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let document: PDFDocumentProxy | undefined;
    setLoading(true);
    void openPreview(files[0], controller.signal)
      .then((loaded) => {
        document = loaded;
        if (controller.signal.aborted) {
          void loaded.loadingTask.destroy();
          return;
        }
        setDoc(loaded);
        setOptions((current) => ({
          ...current,
          pages: Array.from({ length: loaded.numPages }, (_, index) => ({ index, rotation: 0 })),
        }));
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setError(cause instanceof Error ? cause.message : "Unable to preview this file.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      if (document) void document.loadingTask.destroy();
    };
  }, [files, preview]);

  const addFiles = async (incoming: File[]) => {
    const token = ++validation.current;
    setValidating(true);
    setError("");
    try {
      const next = multiple ? [...files, ...incoming] : incoming;
      validateBatch(next, multiple);
      for (const file of incoming) await validateUpload(file, images ? "image" : "pdf");
      if (token !== validation.current) return;
      clearResults();
      setNotice("");
      setFiles(next);
    } catch (cause) {
      if (token === validation.current)
        setError(cause instanceof Error ? cause.message : "Unable to upload files.");
    } finally {
      if (token === validation.current) setValidating(false);
    }
  };
  const reset = () => {
    validation.current++;
    job.current?.abort();
    clearResults();
    setFiles([]);
    setDoc(undefined);
    setOptions(initial);
    setError("");
    setNotice("");
    setProgress(undefined);
    setLoading(false);
    setValidating(false);
  };
  const run = async () => {
    clearResults();
    setError("");
    setNotice("");
    setProgress(undefined);
    setBusy(true);
    const controller = new AbortController();
    job.current = controller;
    try {
      validateBatch(files, multiple);
      if (
        (slug === "protect" || slug === "unlock") &&
        (!options.password ||
          /[\r\n\0]/.test(options.password) ||
          new TextEncoder().encode(options.password).length > 127)
      )
        throw new Error("Enter a password of 1–127 UTF-8 bytes without line breaks.");
      if (preview && !doc) throw new Error("Open a valid PDF before processing.");
      const outputs = await processFiles(
        slug,
        files,
        options,
        (completed, total) => {
          if (!controller.signal.aborted) setProgress({ completed, total });
        },
        controller.signal,
      );
      controller.signal.throwIfAborted();
      if (slug === "compress" && outputs[0].bytes.byteLength >= files[0].size) {
        outputs[0].bytes = new Uint8Array(await files[0].arrayBuffer());
        outputs[0].name = files[0].name;
        setNotice(
          "No size reduction was possible with this preset. Your original PDF is retained.",
        );
      }
      controller.signal.throwIfAborted();
      const next = outputs.map((output) => ({
        name: output.name,
        size: output.bytes.byteLength,
        url: URL.createObjectURL(
          new Blob([output.bytes.slice().buffer as ArrayBuffer], { type: output.mime }),
        ),
      }));
      resultRefs.current = next;
      setResults(next);
      setNotice((current) => current || "Done. Download your result or clear files to release it.");
    } catch (cause) {
      if (controller.signal.aborted)
        setNotice("Processing cancelled. You can try again or clear files.");
      else
        setError(cause instanceof Error ? cause.message : "Processing failed. Try another file.");
    } finally {
      setOptions((current) => ({ ...current, password: "" }));
      if (job.current === controller) {
        setBusy(false);
        job.current = undefined;
      }
    }
  };
  const updateFiles = (next: File[]) => {
    clearResults();
    setNotice("");
    setError("");
    setFiles(next);
  };
  const reorderPages = (from: number, to: number) =>
    change("pages", moveItem(options.pages, from, to));

  return (
    <div className="space-y-6">
      <UploadZone onFiles={addFiles} multiple={multiple} images={images} disabled={disabled} />
      <p className="text-xs text-muted-foreground">
        No files are sent to a server. Up to 30 files, 100 MB combined, and 300 pages for
        manipulation or rendering. Clear files or leave this tool to release temporary data.
      </p>
      {(validating || loading) && (
        <p role="status">{validating ? "Validating files…" : "Loading page previews…"}</p>
      )}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm"
        >
          {error}
        </div>
      )}
      {notice && (
        <p role="status" className="rounded-lg border border-border p-4 text-sm">
          {notice}
        </p>
      )}
      {files.length > 0 && (
        <>
          <ol aria-label="Selected files" className="space-y-2">
            {files.map((file, index) => (
              <li
                key={`${index}-${file.name}`}
                draggable={multiple && !disabled}
                onDragStart={() => {
                  dragFile.current = index;
                }}
                onDragEnd={() => {
                  dragFile.current = undefined;
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (!disabled && dragFile.current !== undefined)
                    updateFiles(moveItem(files, dragFile.current, index));
                  dragFile.current = undefined;
                }}
                className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3"
              >
                <span className="min-w-0 flex-1 break-all text-sm">
                  {index + 1}. {file.name}{" "}
                  <span className="text-muted-foreground">({fileSize(file.size)})</span>
                </span>
                {multiple && (
                  <>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={`Move file ${index + 1} up`}
                      disabled={disabled || index === 0}
                      onClick={() => updateFiles(moveItem(files, index, index - 1))}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      aria-label={`Move file ${index + 1} down`}
                      disabled={disabled || index === files.length - 1}
                      onClick={() => updateFiles(moveItem(files, index, index + 1))}
                    >
                      <ArrowDown />
                    </Button>
                  </>
                )}
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={`Remove file ${index + 1}`}
                  disabled={disabled}
                  onClick={() => updateFiles(files.filter((_, i) => i !== index))}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ol>
          {doc && <p role="status">{doc.numPages} pages</p>}
          <fieldset
            disabled={disabled}
            className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
          >
            <legend className="px-2 text-sm font-medium">Options</legend>
            {slug === "split" && (
              <>
                <label className="space-y-2 text-sm">
                  Split mode
                  <select
                    className={selectClass}
                    value={options.splitMode}
                    onChange={(e) => change("splitMode", e.target.value as PdfOptions["splitMode"])}
                  >
                    <option value="ranges">Page ranges</option>
                    <option value="every">Every N pages</option>
                    <option value="single">Extract individual pages</option>
                  </select>
                </label>
                {options.splitMode === "every" && (
                  <label className="space-y-2 text-sm">
                    Pages per file
                    <Input
                      type="number"
                      min={1}
                      max={doc?.numPages ?? 300}
                      value={options.every}
                      onChange={(e) => change("every", Number(e.target.value))}
                    />
                  </label>
                )}
              </>
            )}
            {["split", "watermark", "page-numbers", "pdf-to-jpg", "pdf-to-png"].includes(slug) && (
              <label className="space-y-2 text-sm">
                Page range (blank = all)
                <Input
                  value={options.range}
                  placeholder={
                    slug === "split" && options.splitMode === "ranges"
                      ? "1-3;4-6 (one file per group)"
                      : "1-3,5"
                  }
                  onChange={(e) => change("range", e.target.value)}
                />
              </label>
            )}
            {slug === "compress" && (
              <>
                <label className="space-y-2 text-sm">
                  Quality preset
                  <select
                    className={selectClass}
                    value={options.quality}
                    onChange={(e) => change("quality", e.target.value as PdfOptions["quality"])}
                  >
                    <option value="lossless">Lossless — preserve text and forms</option>
                    <option value="high">High — 144 DPI, JPEG 85%</option>
                    <option value="balanced">Balanced — 110 DPI, JPEG 70%</option>
                    <option value="small">Small — 72 DPI, JPEG 50%</option>
                  </select>
                </label>
                <p className="self-center text-sm text-muted-foreground">
                  {options.quality === "lossless"
                    ? "Optimizes PDF streams without rasterizing. Some PDFs cannot be made smaller."
                    : "This preset converts pages to images. Searchable text, links, forms, signatures and accessibility tags will not be retained."}
                </p>
              </>
            )}
            {images && (
              <>
                <label className="space-y-2 text-sm">
                  Page size
                  <select
                    className={selectClass}
                    value={options.pageSize}
                    onChange={(e) => change("pageSize", e.target.value as PdfOptions["pageSize"])}
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="fit">Fit image</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  Margin (points)
                  <Input
                    type="number"
                    min={0}
                    max={144}
                    value={options.margin}
                    onChange={(e) => change("margin", Number(e.target.value))}
                  />
                </label>
              </>
            )}
            {["pdf-to-jpg", "pdf-to-png"].includes(slug) && (
              <>
                <label className="space-y-2 text-sm">
                  Image format
                  <select
                    className={selectClass}
                    value={options.imageFormat}
                    onChange={(e) =>
                      change("imageFormat", e.target.value as PdfOptions["imageFormat"])
                    }
                  >
                    <option value="png">PNG</option>
                    <option value="jpeg">JPG</option>
                  </select>
                </label>
                <label className="space-y-2 text-sm">
                  Resolution (DPI)
                  <Input
                    type="number"
                    min={72}
                    max={300}
                    value={options.dpi}
                    onChange={(e) => change("dpi", Number(e.target.value))}
                  />
                </label>
                <p className="text-sm text-muted-foreground sm:col-span-2">
                  One selected page downloads as an image; multiple pages download as a ZIP.
                </p>
              </>
            )}
            {["protect", "unlock"].includes(slug) && (
              <label className="space-y-2 text-sm">
                {slug === "protect" ? "New PDF password" : "Current PDF password"}
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={options.password}
                  onChange={(e) => change("password", e.target.value)}
                />
                <span className="block text-xs text-muted-foreground">
                  Passwords stay in memory, are never logged, and are cleared after processing.
                </span>
              </label>
            )}
            {slug === "watermark" && (
              <>
                <label className="space-y-2 text-sm">
                  Watermark text
                  <Input
                    maxLength={100}
                    value={options.watermark}
                    onChange={(e) => change("watermark", e.target.value)}
                  />
                </label>
                <label className="space-y-2 text-sm">
                  Opacity
                  <Input
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={options.opacity}
                    onChange={(e) => change("opacity", Number(e.target.value))}
                  />
                </label>
              </>
            )}
            {["watermark", "page-numbers"].includes(slug) && (
              <label className="space-y-2 text-sm">
                Font size (points)
                <Input
                  type="number"
                  min={8}
                  max={144}
                  value={options.fontSize}
                  onChange={(e) => change("fontSize", Number(e.target.value))}
                />
              </label>
            )}
            {["merge", "rotate", "organize", "delete"].includes(slug) && (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                {slug === "merge"
                  ? "Drag files to reorder, or use the arrow buttons. Files are merged in the displayed order."
                  : "Drag pages to reorder or use arrow buttons. Rotate or remove pages below. Page numbers refer to the original PDF."}
              </p>
            )}
          </fieldset>
          {pageEditor && doc && (
            <>
              <Button
                variant="outline"
                disabled={disabled}
                onClick={() =>
                  change(
                    "pages",
                    Array.from({ length: doc.numPages }, (_, index) => ({ index, rotation: 0 })),
                  )
                }
              >
                Restore all pages
              </Button>
              <ol
                aria-label="PDF pages"
                className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 lg:grid-cols-3"
              >
                {options.pages.map((page, position) => (
                  <li
                    key={`${page.index}-${page.rotation}`}
                    draggable={!disabled}
                    onDragStart={() => {
                      dragPage.current = position;
                    }}
                    onDragEnd={() => {
                      dragPage.current = undefined;
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!disabled && dragPage.current !== undefined)
                        reorderPages(dragPage.current, position);
                      dragPage.current = undefined;
                    }}
                    className="rounded-xl border border-border bg-card p-3"
                  >
                    <PageThumbnail doc={doc} index={page.index} rotation={page.rotation} />
                    <p className="my-2 text-sm">
                      Page {page.index + 1} · +{page.rotation}°
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Move page ${page.index + 1} up`}
                        disabled={disabled || position === 0}
                        onClick={() => reorderPages(position, position - 1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Move page ${page.index + 1} down`}
                        disabled={disabled || position === options.pages.length - 1}
                        onClick={() => reorderPages(position, position + 1)}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Rotate page ${page.index + 1}`}
                        disabled={disabled}
                        onClick={() =>
                          change(
                            "pages",
                            options.pages.map((p) =>
                              p.index === page.index
                                ? { ...p, rotation: (p.rotation + 90) % 360 }
                                : p,
                            ),
                          )
                        }
                      >
                        <RotateCw />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label={`Delete page ${page.index + 1}`}
                        disabled={disabled}
                        onClick={() =>
                          change(
                            "pages",
                            options.pages.filter((p) => p.index !== page.index),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            </>
          )}
          <div className="flex flex-wrap gap-3">
            <Button disabled={disabled || !files.length} onClick={() => void run()}>
              Process {files.length > 1 ? "files" : "file"}
            </Button>
            {busy && (
              <Button variant="outline" onClick={() => job.current?.abort()}>
                Cancel processing
              </Button>
            )}
            <Button variant="outline" onClick={reset}>
              Clear files
            </Button>
          </div>
        </>
      )}
      {busy && (
        <div role="status" aria-live="polite">
          <p>
            {progress
              ? `Processing ${progress.completed} of ${progress.total}`
              : "Preparing your files…"}
          </p>
          <progress
            aria-label="Processing progress"
            className="mt-2 w-full"
            max={progress?.total ?? 1}
            value={progress?.completed}
          />
        </div>
      )}
      {results.length > 0 && (
        <section
          aria-label="Download results"
          className="space-y-3 rounded-2xl border border-primary/30 bg-primary/5 p-5"
        >
          <h2 className="font-display text-xl">Your result</h2>
          <p className="text-sm">
            Before: {fileSize(files.reduce((n, file) => n + file.size, 0))} · After:{" "}
            {fileSize(results.reduce((n, result) => n + result.size, 0))}
          </p>
          {results.map((result) => (
            <Button asChild key={result.url}>
              <a href={result.url} download={result.name}>
                <Download aria-hidden="true" /> Download {result.name}
              </a>
            </Button>
          ))}
        </section>
      )}
    </div>
  );
}
