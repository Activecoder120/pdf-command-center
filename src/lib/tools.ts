import {
  Combine, Scissors, Minimize2, FileText, FileType2, Image as ImageIcon,
  ImagePlus, RotateCw, Unlock, Lock, Stamp, LayoutGrid, type LucideIcon,
} from "lucide-react";

export type Tool = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: "violet" | "blue" | "green" | "rose" | "amber";
};

export const TOOLS: Tool[] = [
  { slug: "merge", name: "Merge PDF", description: "Combine multiple PDFs into one document.", icon: Combine, accent: "violet" },
  { slug: "split", name: "Split PDF", description: "Extract pages or split into separate files.", icon: Scissors, accent: "blue" },
  { slug: "compress", name: "Compress PDF", description: "Reduce file size without losing quality.", icon: Minimize2, accent: "green" },
  { slug: "pdf-to-word", name: "PDF to Word", description: "Convert PDFs into editable .docx files.", icon: FileText, accent: "blue" },
  { slug: "word-to-pdf", name: "Word to PDF", description: "Turn Word documents into clean PDFs.", icon: FileType2, accent: "violet" },
  { slug: "jpg-to-pdf", name: "JPG to PDF", description: "Convert images into a single PDF.", icon: ImagePlus, accent: "amber" },
  { slug: "pdf-to-jpg", name: "PDF to JPG", description: "Extract every page as a high‑res image.", icon: ImageIcon, accent: "amber" },
  { slug: "rotate", name: "Rotate PDF", description: "Rotate pages to the perfect orientation.", icon: RotateCw, accent: "blue" },
  { slug: "unlock", name: "Unlock PDF", description: "Remove passwords from secured PDFs.", icon: Unlock, accent: "green" },
  { slug: "protect", name: "Protect PDF", description: "Add encryption and password protection.", icon: Lock, accent: "rose" },
  { slug: "watermark", name: "Add Watermark", description: "Stamp text or logos on every page.", icon: Stamp, accent: "violet" },
  { slug: "organize", name: "Organize Pages", description: "Reorder, delete and arrange pages.", icon: LayoutGrid, accent: "blue" },
];

export const accentClass: Record<Tool["accent"], string> = {
  violet: "from-[oklch(0.66_0.22_290)] to-[oklch(0.55_0.22_280)]",
  blue:   "from-[oklch(0.72_0.16_250)] to-[oklch(0.55_0.18_255)]",
  green:  "from-[oklch(0.74_0.18_145)] to-[oklch(0.55_0.16_160)]",
  rose:   "from-[oklch(0.70_0.20_20)]  to-[oklch(0.55_0.22_15)]",
  amber:  "from-[oklch(0.80_0.15_75)]  to-[oklch(0.60_0.18_55)]",
};
