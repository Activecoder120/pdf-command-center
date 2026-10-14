import { useEffect, useRef, useState } from "react";
import { UploadCloud, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_UPLOAD_BYTES } from "@/lib/upload";

export function UploadZone({
  onFiles,
  multiple = false,
  images = false,
  disabled = false,
}: {
  onFiles: (files: File[]) => Promise<void>;
  multiple?: boolean;
  images?: boolean;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  disabled = disabled || !ready;
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) void onFiles(Array.from(event.dataTransfer.files));
      }}
      className={`relative rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border bg-card/40"}`}
    >
      <UploadCloud className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
      <h2 className="mt-3 font-display text-2xl font-semibold">
        Drop {multiple ? "files" : "a PDF"} here
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {images ? "PNG or JPG" : "PDF"} · {MAX_UPLOAD_BYTES / 1024 / 1024} MB per file · processed
        in your browser
      </p>
      <Button
        type="button"
        disabled={disabled}
        onClick={() => input.current?.click()}
        className="mt-5"
      >
        <FileUp aria-hidden="true" /> Select {multiple ? "files" : "file"}
      </Button>
      <input
        ref={input}
        type="file"
        aria-label={images ? "Upload images" : "Upload PDFs"}
        className="sr-only"
        tabIndex={-1}
        accept={images ? "image/png,image/jpeg,.png,.jpg,.jpeg" : "application/pdf,.pdf"}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length) void onFiles(files);
        }}
      />
    </div>
  );
}
