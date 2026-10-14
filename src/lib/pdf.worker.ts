import { archive, manipulate, outputPdf, pdfName } from "./pdf-engine";
import type { PdfJob } from "./pdf-types";

self.onmessage = async (event: MessageEvent<PdfJob>) => {
  if (["protect", "unlock"].includes(event.data.slug)) {
    // QPDF's generated runtime binds console functions internally. Silence them
    // before importing it so neither command arguments nor diagnostics leak passwords.
    console.log = console.error = console.warn = () => {};
  }
  try {
    const job = event.data;
    let outputs;
    if (
      ["protect", "unlock"].includes(job.slug) ||
      (job.slug === "compress" && job.options.quality === "lossless")
    ) {
      outputs = [await qpdf(job)];
    } else
      outputs = await manipulate(job, (completed, total) =>
        self.postMessage({ type: "progress", completed, total }),
      );
    const combined = outputs.length > 1 ? archive(outputs) : undefined;
    const result = combined ? [combined] : outputs;
    self.postMessage(
      { type: "result", outputs: result },
      { transfer: result.map((file) => file.bytes.buffer as ArrayBuffer) },
    );
  } catch (error) {
    // Never relay QPDF's CLI arguments or logs: they may contain passwords.
    self.postMessage({
      type: "error",
      message:
        event.data.slug === "protect" || event.data.slug === "unlock"
          ? "Unable to process this PDF. Check the password and file, then try again."
          : error instanceof Error
            ? error.message
            : "Unable to process the file.",
    });
  }
};

async function qpdf(job: PdfJob) {
  const { default: createModule } = await import("@neslinesli93/qpdf-wasm");
  const { default: wasmUrl } = await import("@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url");
  const init = createModule as unknown as (options: {
    locateFile: () => string;
    print: () => void;
    printErr: () => void;
    noInitialRun: boolean;
  }) => Promise<import("@neslinesli93/qpdf-wasm").QpdfInstance>;
  const module = await init({
    locateFile: () => wasmUrl,
    print: () => {},
    printErr: () => {},
    noInitialRun: true,
  });
  const fs = module.FS as typeof module.FS & {
    writeFile: (path: string, value: string) => void;
    unlink: (path: string) => void;
  };
  const password = job.options.password;
  if (
    job.slug !== "compress" &&
    (!password || /[\r\n\0]/.test(password) || new TextEncoder().encode(password).length > 127)
  )
    throw new Error("Invalid password.");
  fs.mkdir("/input");
  fs.mount(
    module.WORKERFS,
    {
      blobs: [
        { name: "source.pdf", data: new Blob([job.inputs[0].bytes.slice().buffer as ArrayBuffer]) },
      ],
    },
    "/input",
  );
  try {
    let args: string[];
    if (job.slug === "protect") {
      // Independent owner secret prevents the user password from being an empty-owner encryption.
      const owner = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      args = ["/input/source.pdf", "--encrypt", password, owner, "256", "--", "/output.pdf"];
    } else if (job.slug === "unlock") {
      fs.writeFile("/password", password);
      args = ["--password-file=/password", "--decrypt", "/input/source.pdf", "/output.pdf"];
    } else
      args = [
        "--object-streams=generate",
        "--compress-streams=y",
        "--recompress-flate",
        "--compression-level=9",
        "/input/source.pdf",
        "/output.pdf",
      ];
    const status = module.callMain(args);
    if (status !== 0 && status !== 3) throw new Error("QPDF processing failed.");
    const bytes = fs.readFile("/output.pdf").slice();
    return outputPdf(`${pdfName(job.inputs[0].name)}-${job.slug}.pdf`, bytes);
  } finally {
    fs.unmount("/input");
    try {
      fs.unlink("/password");
    } catch {
      /* Password file is created only when unlocking. */
    }
    try {
      fs.unlink("/output.pdf");
    } catch {
      /* Failed jobs may not produce output. */
    }
  }
}
