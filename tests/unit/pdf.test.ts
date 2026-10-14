import test from "node:test";
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { unzipSync } from "fflate";
import { archive, manipulate, parsePages } from "../../src/lib/pdf-engine.ts";
import { defaultOptions } from "../../src/lib/pdf-types.ts";
import { moveItem } from "../../src/lib/order.ts";
import { uploadLimit, validateBatch, validateUpload } from "../../src/lib/upload.ts";

async function fixture(count = 3) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < count; i++)
    doc
      .addPage([100 + i * 20, 200 + i * 20])
      .drawText(`Page ${i + 1}`, { font, size: 12, x: 10, y: 20 });
  return { name: "sample.pdf", bytes: await doc.save() };
}
const options = () => ({ ...defaultOptions, pages: [] });

test("page ranges preserve selection order, deduplicate and default to all", () => {
  assert.deepEqual(parsePages("3,1-2,2", 3), [2, 0, 1]);
  assert.deepEqual(parsePages("", 3), [0, 1, 2]);
});
for (const range of ["0", "4", "3-1", "-1", "1,", "x", "1.5", "1-99999999"]) {
  test(`invalid range ${range} is rejected`, () => assert.throws(() => parsePages(range, 3)));
}
test("merge respects the displayed file order", async () => {
  const a = await fixture(1),
    b = await fixture(2);
  const [output] = await manipulate({ slug: "merge", inputs: [b, a], options: options() });
  const doc = await PDFDocument.load(output.bytes);
  assert.equal(doc.getPageCount(), 3);
  assert.deepEqual(
    doc.getPages().map((p) => p.getWidth()),
    [100, 120, 100],
  );
});
test("merge requires two inputs and bounds total pages", async () => {
  await assert.rejects(
    manipulate({ slug: "merge", inputs: [await fixture()], options: options() }),
    /at least two/,
  );
  await assert.rejects(
    manipulate({
      slug: "merge",
      inputs: [await fixture(200), await fixture(101)],
      options: options(),
    }),
    /300 pages/,
  );
});
test("split supports separate page range groups", async () => {
  const outputs = await manipulate({
    slug: "split",
    inputs: [await fixture()],
    options: { ...options(), range: "1-2;3" },
  });
  assert.equal(outputs.length, 2);
  assert.equal((await PDFDocument.load(outputs[0].bytes)).getPageCount(), 2);
  assert.equal((await PDFDocument.load(outputs[1].bytes)).getPage(0).getWidth(), 140);
});
test("split every N pages includes the remainder", async () => {
  const outputs = await manipulate({
    slug: "split",
    inputs: [await fixture()],
    options: { ...options(), splitMode: "every", every: 2 },
  });
  assert.deepEqual(
    await Promise.all(
      outputs.map(async (output) => (await PDFDocument.load(output.bytes)).getPageCount()),
    ),
    [2, 1],
  );
});
test("single-page extraction respects selected ranges", async () => {
  const outputs = await manipulate({
    slug: "split",
    inputs: [await fixture()],
    options: { ...options(), splitMode: "single", range: "3,1" },
  });
  assert.deepEqual(
    await Promise.all(
      outputs.map(async (output) => (await PDFDocument.load(output.bytes)).getPage(0).getWidth()),
    ),
    [140, 100],
  );
});
test("invalid split chunk size fails", async () => {
  await assert.rejects(
    manipulate({
      slug: "split",
      inputs: [await fixture()],
      options: { ...options(), splitMode: "every", every: 0 },
    }),
    /Pages per file/,
  );
});
test("page editing reorders, rotates and removes pages while retaining originals", async () => {
  const [output] = await manipulate({
    slug: "organize",
    inputs: [await fixture()],
    options: {
      ...options(),
      pages: [
        { index: 2, rotation: 90 },
        { index: 0, rotation: 180 },
      ],
    },
  });
  const doc = await PDFDocument.load(output.bytes);
  assert.equal(doc.getPageCount(), 2);
  assert.deepEqual(
    doc.getPages().map((p) => p.getWidth()),
    [140, 100],
  );
  assert.deepEqual(
    doc.getPages().map((p) => p.getRotation().angle),
    [90, 180],
  );
});
test("deleting all pages is rejected", async () => {
  await assert.rejects(
    manipulate({ slug: "delete", inputs: [await fixture()], options: options() }),
    /Keep at least one/,
  );
});
test("invalid or repeated page indices are rejected", async () => {
  const input = await fixture();
  await assert.rejects(
    manipulate({
      slug: "rotate",
      inputs: [input],
      options: { ...options(), pages: [{ index: 9, rotation: 90 }] },
    }),
    /Invalid page/,
  );
  await assert.rejects(
    manipulate({
      slug: "organize",
      inputs: [input],
      options: {
        ...options(),
        pages: [
          { index: 1, rotation: 0 },
          { index: 1, rotation: 0 },
        ],
      },
    }),
    /duplicates/,
  );
});
for (const slug of ["watermark", "page-numbers"])
  test(`${slug} modifies selected pages and remains readable`, async () => {
    const input = await fixture();
    const [output] = await manipulate({
      slug,
      inputs: [input],
      options: { ...options(), range: "2" },
    });
    const before = await PDFDocument.load(input.bytes),
      after = await PDFDocument.load(output.bytes);
    assert.equal(after.getPageCount(), 3);
    assert.ok(
      after.getPage(1).node.Contents()?.toString() !==
        before.getPage(1).node.Contents()?.toString(),
    );
    assert.equal(
      after.getPage(0).node.Contents()?.toString(),
      before.getPage(0).node.Contents()?.toString(),
    );
  });
test("watermark validates unsupported text and invalid parameters", async () => {
  const inputs = [await fixture()];
  await assert.rejects(
    manipulate({ slug: "watermark", inputs, options: { ...options(), watermark: "" } }),
    /1–100/,
  );
  await assert.rejects(
    manipulate({ slug: "watermark", inputs, options: { ...options(), opacity: 2 } }),
    /valid font/,
  );
  await assert.rejects(
    manipulate({ slug: "watermark", inputs, options: { ...options(), watermark: "你好" } }),
    /Latin/,
  );
});
test("PNG images become ordered A4 or fitted PDF pages with margins", async () => {
  const inputs = [
    {
      name: "image.png",
      bytes: new Uint8Array(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFYkAAAAASUVORK5CYII=",
          "base64",
        ),
      ),
    },
  ];
  const [a4] = await manipulate({
    slug: "jpg-to-pdf",
    inputs: [...inputs, ...inputs],
    options: options(),
  });
  const doc = await PDFDocument.load(a4.bytes);
  assert.equal(doc.getPageCount(), 2);
  assert.ok(Math.abs(doc.getPage(0).getWidth() - 595.28) < 1);
  const [fit] = await manipulate({
    slug: "jpg-to-pdf",
    inputs,
    options: { ...options(), pageSize: "fit", margin: 10 },
  });
  assert.equal((await PDFDocument.load(fit.bytes)).getPage(0).getWidth(), 21);
});
test("ZIP downloads contain readable split PDFs", async () => {
  const outputs = await manipulate({
    slug: "split",
    inputs: [await fixture()],
    options: { ...options(), splitMode: "single" },
  });
  const zip = archive(outputs),
    contents = unzipSync(zip.bytes);
  assert.equal(Object.keys(contents).length, 3);
  for (const bytes of Object.values(contents))
    assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1);
});
test("malformed PDFs fail with an actionable error", async () => {
  await assert.rejects(
    manipulate({
      slug: "watermark",
      inputs: [{ name: "bad.pdf", bytes: new TextEncoder().encode("%PDF-garbage") }],
      options: options(),
    }),
    /unable to open PDF/,
  );
});
test("uploads validate signatures, empty files, type and configurable size", async () => {
  const pdf = new File(["%PDF-1.7\n"], "a.pdf", { type: "application/pdf" });
  await validateUpload(pdf, "pdf");
  await assert.rejects(validateUpload(new File(["not a PDF"], "fake.pdf"), "pdf"), /signature/);
  await assert.rejects(validateUpload(new File(["%PDF-1.7"], "fake.txt"), "pdf"), /signature/);
  await assert.rejects(validateUpload(new File([], "empty.pdf"), "pdf"), /empty/);
  await assert.rejects(validateUpload(pdf, "pdf", 2), /maximum file size/);
  assert.equal(uploadLimit("10"), 10 * 1024 * 1024);
  assert.equal(uploadLimit("bad"), 50 * 1024 * 1024);
});
test("batches enforce file-count, single-file and aggregate limits", () => {
  const file = new File(["x"], "a.pdf");
  assert.throws(() => validateBatch([], true), /Select/);
  assert.throws(() => validateBatch([file, file], false), /one PDF/);
  assert.throws(() => validateBatch(Array(31).fill(file), true), /30/);
  assert.throws(() => validateBatch([{ size: 101 * 1024 * 1024 } as File], true), /100 MB/);
});
test("ordering supports first-to-last and invalid moves without mutating input", () => {
  const input = ["a", "b", "c"];
  assert.deepEqual(moveItem(input, 0, 2), ["b", "c", "a"]);
  assert.deepEqual(input, ["a", "b", "c"]);
  assert.deepEqual(moveItem(input, -1, 2), input);
});

test("PNG upload rejects a decompression-sized canvas before decoding", async () => {
  const bytes = new Uint8Array(32);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, 100000);
  view.setUint32(20, 100000);
  await assert.rejects(validateUpload(new File([bytes], "huge.png"), "image"), /16 million/);
});
