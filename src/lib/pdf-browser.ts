import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { PDFDocument } from "pdf-lib";
import { archive, outputPdf, parsePages, pdfName } from "./pdf-engine";
import { MAX_OUTPUT_BYTES, MAX_PAGES } from "./pdf-types";
import type { OutputData, PdfJob, Progress } from "./pdf-types";

export async function openPreview(file: File, signal?: AbortSignal) {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  signal?.throwIfAborted();
  const bytes = new Uint8Array(await file.arrayBuffer());
  signal?.throwIfAborted();
  const task = pdfjs.getDocument({
    data: bytes,
    maxImageSize: 16_000_000,
    verbosity: 0,
    cMapUrl: `${import.meta.env.BASE_URL}pdfjs/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
    wasmUrl: `${import.meta.env.BASE_URL}pdfjs/wasm/`,
    iccUrl: `${import.meta.env.BASE_URL}pdfjs/iccs/`,
  });
  const cancel = () => {
    void task.destroy();
  };
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const doc = await task.promise;
    signal?.throwIfAborted();
    if (doc.numPages > MAX_PAGES)
      throw new Error(`Select a PDF with no more than ${MAX_PAGES} pages.`);
    return doc;
  } catch (error) {
    await task.destroy();
    if (signal?.aborted) throw signal.reason;
    if (error instanceof Error && error.name === "PasswordException")
      throw new Error("This PDF needs a password. Use Unlock PDF first.");
    throw new Error(
      error instanceof Error && error.message.startsWith("Select a PDF")
        ? error.message
        : "Unable to read this PDF. It may be damaged or unsupported.",
    );
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}

export async function renderPage(
  doc: PDFDocumentProxy,
  index: number,
  canvas: HTMLCanvasElement,
  scale: number,
  signal?: AbortSignal,
  rotation?: number,
) {
  signal?.throwIfAborted();
  const page = await doc.getPage(index + 1);
  signal?.throwIfAborted();
  const viewport = page.getViewport({ scale, rotation: (page.rotate + (rotation ?? 0)) % 360 });
  if (viewport.width * viewport.height > 16_000_000)
    throw new Error("This page is too large to render. Choose a lower resolution.");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  let task: RenderTask | undefined;
  const cancel = () => task?.cancel();
  try {
    task = page.render({ canvas, viewport, background: "white" });
    signal?.addEventListener("abort", cancel, { once: true });
    if (signal?.aborted) cancel();
    await task.promise;
    signal?.throwIfAborted();
  } finally {
    signal?.removeEventListener("abort", cancel);
    page.cleanup();
  }
}

function canvasBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Unable to encode this page as an image.")),
      mime,
      quality,
    ),
  );
}

async function rasterize(
  file: File,
  job: PdfJob,
  progress: Progress,
  signal: AbortSignal,
): Promise<OutputData[]> {
  const doc = await openPreview(file, signal);
  const canvas = document.createElement("canvas");
  try {
    const indices = parsePages(job.options.range, doc.numPages);
    const compress = job.slug === "compress";
    const presets = {
      high: { dpi: 144, quality: 0.85 },
      balanced: { dpi: 110, quality: 0.7 },
      small: { dpi: 72, quality: 0.5 },
      lossless: { dpi: 144, quality: 1 },
    };
    const preset = presets[job.options.quality];
    const dpi = compress ? preset.dpi : job.options.dpi;
    if (!Number.isFinite(dpi) || dpi < 72 || dpi > 300)
      throw new Error("Resolution must be between 72 and 300 DPI.");
    const pdf = compress ? await PDFDocument.create() : undefined;
    const outputs: OutputData[] = [];
    let total = 0;
    for (const [i, index] of indices.entries()) {
      signal.throwIfAborted();
      await renderPage(doc, index, canvas, dpi / 72, signal);
      const mime = compress || job.options.imageFormat === "jpeg" ? "image/jpeg" : "image/png";
      const bytes = new Uint8Array(
        await (await canvasBlob(canvas, mime, compress ? preset.quality : 0.9)).arrayBuffer(),
      );
      total += bytes.byteLength;
      if (total > MAX_OUTPUT_BYTES)
        throw new Error("Images exceed the 100 MB limit. Use fewer pages or a lower resolution.");
      if (pdf) {
        const originalPage = await doc.getPage(index + 1);
        const viewport = originalPage.getViewport({ scale: 1 });
        const image = await pdf.embedJpg(bytes);
        const page = pdf.addPage([viewport.width, viewport.height]);
        page.drawImage(image, { x: 0, y: 0, width: viewport.width, height: viewport.height });
      } else
        outputs.push({
          name: `${pdfName(file.name)}-page-${index + 1}.${mime === "image/png" ? "png" : "jpg"}`,
          bytes,
          mime,
        });
      canvas.width = canvas.height = 0;
      progress(i + 1, indices.length);
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    signal.throwIfAborted();
    if (pdf) return [outputPdf(`${pdfName(file.name)}-compressed.pdf`, await pdf.save())];
    // ZIP construction also runs in the cancellable worker.
    if (outputs.length > 1) return [await zipInWorker(outputs, signal)];
    return outputs;
  } finally {
    canvas.width = canvas.height = 0;
    await doc.loadingTask.destroy();
  }
}

function workerJob(job: PdfJob, progress: Progress, signal: AbortSignal): Promise<OutputData[]> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./pdf.worker.ts", import.meta.url), { type: "module" });
    const finish = () => {
      signal.removeEventListener("abort", cancel);
      worker.terminate();
    };
    const cancel = () => {
      finish();
      reject(new DOMException("Processing cancelled.", "AbortError"));
    };
    signal.addEventListener("abort", cancel, { once: true });
    worker.onerror = () => {
      finish();
      reject(new Error("The processing worker stopped. Try a smaller file."));
    };
    worker.onmessage = (
      event: MessageEvent<{
        type: string;
        message?: string;
        completed: number;
        total: number;
        outputs: OutputData[];
      }>,
    ) => {
      if (event.data.type === "progress") progress(event.data.completed, event.data.total);
      else {
        finish();
        if (event.data.type === "error") reject(new Error(event.data.message));
        else resolve(event.data.outputs);
      }
    };
    worker.postMessage(
      job,
      job.inputs.map((input) => input.bytes.buffer as ArrayBuffer),
    );
  });
}

async function zipInWorker(outputs: OutputData[], signal: AbortSignal) {
  // Reuse a small worker for the potentially large synchronous archive operation.
  signal.throwIfAborted();
  return new Promise<OutputData>((resolve, reject) => {
    const worker = new Worker(new URL("./zip.worker.ts", import.meta.url), { type: "module" });
    const finish = () => {
      worker.terminate();
      signal.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      finish();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    signal.addEventListener("abort", cancel, { once: true });
    worker.onmessage = (event) => {
      finish();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.output);
    };
    worker.onerror = () => {
      finish();
      reject(new Error("Unable to create ZIP. Try fewer pages."));
    };
    worker.postMessage(
      outputs,
      outputs.map((file) => file.bytes.buffer as ArrayBuffer),
    );
  });
}

export async function processFiles(
  slug: string,
  files: File[],
  options: PdfJob["options"],
  progress: Progress,
  signal: AbortSignal,
) {
  const job: PdfJob = { slug, options, inputs: [] };
  if (
    slug === "pdf-to-jpg" ||
    slug === "pdf-to-png" ||
    (slug === "compress" && options.quality !== "lossless")
  ) {
    return rasterize(files[0], job, progress, signal);
  }
  for (const file of files) {
    signal.throwIfAborted();
    job.inputs.push({ name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) });
  }
  signal.throwIfAborted();
  return workerJob(job, progress, signal);
}

// Kept as a named re-export for the separately bundled archive worker.
export { archive };
