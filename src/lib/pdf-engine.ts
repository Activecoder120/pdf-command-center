import { PDFDocument, PageSizes, StandardFonts, degrees, rgb } from "pdf-lib";
import { zipSync } from "fflate";
import { MAX_OUTPUT_BYTES, MAX_PAGES } from "./pdf-types.ts";
import type { InputData, OutputData, PdfJob, Progress } from "./pdf-types.ts";

export function parsePages(value: string, count: number): number[] {
  if (!Number.isInteger(count) || count < 1 || count > MAX_PAGES)
    throw new Error(`PDFs must contain 1–${MAX_PAGES} pages.`);
  if (!value.trim()) return Array.from({ length: count }, (_, i) => i);
  const result: number[] = [];
  for (const token of value.split(",")) {
    const match = token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!match) throw new Error("Use page ranges such as 1-3,5. Page numbers start at 1.");
    const start = Number(match[1]);
    const end = Number(match[2] ?? start);
    if (start < 1 || end < start || end > count)
      throw new Error(`Page ranges must be within 1–${count}.`);
    for (let i = start; i <= end; i++) if (!result.includes(i - 1)) result.push(i - 1);
  }
  return result;
}

export function pdfName(name: string) {
  return (
    name
      .replace(/\.[^.]+$/, "")
      .replace(/[^\p{L}\p{N}._-]/gu, "_")
      .slice(0, 80) || "document"
  );
}

export function outputPdf(name: string, bytes: Uint8Array): OutputData {
  if (bytes.byteLength > MAX_OUTPUT_BYTES)
    throw new Error(
      "Result exceeds the 100 MB output limit. Try fewer pages or a lower resolution.",
    );
  return { name, bytes, mime: "application/pdf" };
}

export function archive(outputs: OutputData[], name = "results.zip"): OutputData {
  if (outputs.reduce((n, file) => n + file.bytes.byteLength, 0) > MAX_OUTPUT_BYTES)
    throw new Error("Results exceed the 100 MB output limit.");
  const bytes = zipSync(
    Object.fromEntries(outputs.map((file, i) => [`${i + 1}-${file.name}`, file.bytes])),
    { level: 0 },
  );
  if (bytes.byteLength > MAX_OUTPUT_BYTES)
    throw new Error("Archive exceeds the 100 MB output limit.");
  return { name, bytes, mime: "application/zip" };
}

async function load(input: InputData) {
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(input.bytes, { updateMetadata: false });
  } catch {
    throw new Error(
      `${input.name}: unable to open PDF. If it is password-protected, use Unlock PDF first.`,
    );
  }
  if (doc.getPageCount() < 1 || doc.getPageCount() > MAX_PAGES)
    throw new Error(`Select a PDF with 1–${MAX_PAGES} pages.`);
  return doc;
}

export async function manipulate(
  job: PdfJob,
  progress: Progress = () => {},
): Promise<OutputData[]> {
  const { slug, inputs, options } = job;
  if (!inputs.length) throw new Error("Select a file first.");
  if (slug === "merge") {
    if (inputs.length < 2) throw new Error("Select at least two PDFs to merge.");
    const result = await PDFDocument.create();
    for (const [i, input] of inputs.entries()) {
      const doc = await load(input);
      if (result.getPageCount() + doc.getPageCount() > MAX_PAGES)
        throw new Error(`Merged documents are limited to ${MAX_PAGES} pages.`);
      for (const page of await result.copyPages(doc, doc.getPageIndices())) result.addPage(page);
      progress(i + 1, inputs.length);
    }
    return [outputPdf("merged.pdf", await result.save())];
  }
  if (slug === "jpg-to-pdf") {
    if (!Number.isFinite(options.margin) || options.margin < 0 || options.margin > 144)
      throw new Error("Margins must be between 0 and 144 points.");
    const result = await PDFDocument.create();
    for (const [i, input] of inputs.entries()) {
      const image =
        input.bytes[0] === 137
          ? await result.embedPng(input.bytes)
          : await result.embedJpg(input.bytes);
      if (image.width * image.height > 16_000_000)
        throw new Error("Images are limited to 16 million pixels. Resize the image first.");
      const dimensions =
        options.pageSize === "fit"
          ? [image.width + options.margin * 2, image.height + options.margin * 2]
          : options.pageSize === "letter"
            ? PageSizes.Letter
            : PageSizes.A4;
      if (dimensions.some((n) => n > 14400))
        throw new Error("Image dimensions are too large. Resize it before converting.");
      const page = result.addPage([dimensions[0], dimensions[1]]);
      const scale = Math.min(
        (page.getWidth() - options.margin * 2) / image.width,
        (page.getHeight() - options.margin * 2) / image.height,
      );
      page.drawImage(image, {
        x: (page.getWidth() - image.width * scale) / 2,
        y: (page.getHeight() - image.height * scale) / 2,
        width: image.width * scale,
        height: image.height * scale,
      });
      progress(i + 1, inputs.length);
    }
    return [outputPdf("images.pdf", await result.save())];
  }
  const doc = await load(inputs[0]);
  const count = doc.getPageCount();
  const name = pdfName(inputs[0].name);
  if (slug === "split") {
    let groups: number[][];
    if (options.splitMode === "ranges")
      groups = options.range.split(";").map((r) => parsePages(r, count));
    else {
      const pages = parsePages(options.range, count);
      const step = options.splitMode === "single" ? 1 : options.every;
      if (!Number.isInteger(step) || step < 1 || step > count)
        throw new Error(`Pages per file must be between 1 and ${count}.`);
      groups = [];
      for (let i = 0; i < pages.length; i += step) groups.push(pages.slice(i, i + step));
    }
    if (groups.length > MAX_PAGES) throw new Error("Too many split ranges.");
    const outputs: OutputData[] = [];
    let totalBytes = 0;
    for (const [i, group] of groups.entries()) {
      const result = await PDFDocument.create();
      for (const page of await result.copyPages(doc, group)) result.addPage(page);
      const output = outputPdf(`${name}-${i + 1}.pdf`, await result.save());
      totalBytes += output.bytes.byteLength;
      if (totalBytes > MAX_OUTPUT_BYTES) throw new Error("Results exceed the 100 MB output limit.");
      outputs.push(output);
      progress(i + 1, groups.length);
    }
    return outputs;
  }
  if (["rotate", "organize", "delete"].includes(slug)) {
    if (!options.pages.length) throw new Error("Keep at least one page.");
    if (
      options.pages.length > count ||
      new Set(options.pages.map((p) => p.index)).size !== options.pages.length
    )
      throw new Error("Page selection contains duplicates.");
    if (
      options.pages.some(
        (p) =>
          !Number.isInteger(p.index) ||
          p.index < 0 ||
          p.index >= count ||
          !Number.isInteger(p.rotation / 90),
      )
    )
      throw new Error("Invalid page selection or rotation.");
    const result = await PDFDocument.create();
    const pages = await result.copyPages(
      doc,
      options.pages.map((p) => p.index),
    );
    for (const [i, page] of pages.entries()) {
      page.setRotation(degrees((page.getRotation().angle + options.pages[i].rotation) % 360));
      result.addPage(page);
    }
    return [outputPdf(`${name}-edited.pdf`, await result.save())];
  }
  if (slug === "watermark" || slug === "page-numbers") {
    const indices = parsePages(options.range, count);
    if (
      !Number.isFinite(options.fontSize) ||
      options.fontSize < 8 ||
      options.fontSize > 144 ||
      !Number.isFinite(options.opacity) ||
      options.opacity < 0.05 ||
      options.opacity > 1
    )
      throw new Error("Choose a valid font size and opacity.");
    if (slug === "watermark" && (!options.watermark.trim() || options.watermark.length > 100))
      throw new Error("Enter a watermark of 1–100 characters.");
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (const [i, index] of indices.entries()) {
      const page = doc.getPage(index);
      const text = slug === "page-numbers" ? `${index + 1} / ${count}` : options.watermark;
      let size = slug === "page-numbers" ? Math.min(options.fontSize, 24) : options.fontSize;
      try {
        size = Math.min(size, (page.getWidth() - 24) / font.widthOfTextAtSize(text, 1));
      } catch {
        throw new Error(
          "The watermark font supports Latin characters. Use Latin text for this version.",
        );
      }
      page.drawText(text, {
        font,
        size,
        x: Math.max(12, (page.getWidth() - font.widthOfTextAtSize(text, size)) / 2),
        y: slug === "page-numbers" ? 16 : page.getHeight() / 2,
        color: rgb(0.35, 0.35, 0.35),
        opacity: slug === "page-numbers" ? 1 : options.opacity,
      });
      progress(i + 1, indices.length);
    }
    return [outputPdf(`${name}-${slug}.pdf`, await doc.save())];
  }
  throw new Error("This tool is not available yet.");
}
