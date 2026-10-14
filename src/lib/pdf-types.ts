export type PageChoice = { index: number; rotation: number };
export type PdfOptions = {
  range: string;
  splitMode: "ranges" | "every" | "single";
  every: number;
  pages: PageChoice[];
  watermark: string;
  fontSize: number;
  opacity: number;
  pageSize: "a4" | "letter" | "fit";
  margin: number;
  imageFormat: "png" | "jpeg";
  dpi: number;
  quality: "lossless" | "high" | "balanced" | "small";
  password: string;
};

export const defaultOptions: PdfOptions = {
  range: "",
  splitMode: "ranges",
  every: 1,
  pages: [],
  watermark: "CONFIDENTIAL",
  fontSize: 36,
  opacity: 0.25,
  pageSize: "a4",
  margin: 24,
  imageFormat: "png",
  dpi: 144,
  quality: "lossless",
  password: "",
};

export type InputData = { name: string; bytes: Uint8Array };
export type OutputData = { name: string; bytes: Uint8Array; mime: string };
export type Progress = (completed: number, total: number) => void;
export type PdfJob = { slug: string; inputs: InputData[]; options: PdfOptions };

export const MAX_PAGES = 300;
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_OUTPUT_BYTES = 100 * 1024 * 1024;
export const MAX_FILES = 30;
