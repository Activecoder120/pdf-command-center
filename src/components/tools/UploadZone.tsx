import { useState } from "react";
import { motion } from "framer-motion";
import { UploadCloud, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function UploadZone() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) { setFile(f); toast.success(`${f.name} ready to process`); }
      }}
      className={`relative overflow-hidden rounded-3xl border-2 border-dashed p-12 text-center transition-all ${
        dragging ? "border-primary bg-primary/5" : "border-white/10 bg-white/[0.02]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-primary opacity-[0.06]" />
      <motion.div
        animate={{ y: dragging ? -6 : 0 }}
        className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-white shadow-[0_20px_60px_-20px_var(--primary)]"
      >
        <UploadCloud className="h-7 w-7" />
      </motion.div>
      <h3 className="mt-5 font-display text-2xl font-semibold">
        {file ? file.name : "Drop your file here"}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        or click below to select. PDF, DOCX, JPG up to 100MB.
      </p>
      <div className="mt-6">
        <Button asChild className="bg-gradient-primary border-0 text-white hover:opacity-95">
          <label className="cursor-pointer">
            <FileUp className="mr-2 h-4 w-4" /> Select file
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); toast.success(`${f.name} ready to process`); }
              }}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}
