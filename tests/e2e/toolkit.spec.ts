import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { unzipSync } from "fflate";
import { readFile, writeFile } from "node:fs/promises";

async function pdf(pages = 3) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pages; i++)
    doc
      .addPage([200 + i * 20, 300 + i * 20])
      .drawText(`Original page ${i + 1}`, { font, size: 20, x: 20, y: 100 });
  return Buffer.from(await doc.save());
}
async function upload(page: Page, slug: string, buffer?: Buffer, name = "sample.pdf") {
  buffer ??= await pdf();
  await page.goto(`/tools/${slug}`);
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page.getByLabel("Upload PDFs").setInputFiles({ name, mimeType: "application/pdf", buffer });
  await expect(page.getByRole("button", { name: "Process file", exact: true })).toBeEnabled();
}
async function download(page: Page) {
  await page.getByRole("button", { name: /^Process file/ }).click();
  const link = page.getByRole("link", { name: /^Download / });
  await expect(link).toBeVisible({ timeout: 30000 });
  const pending = page.waitForEvent("download");
  await link.click();
  const result = await pending;
  const path = await result.path();
  expect(path).toBeTruthy();
  return { name: result.suggestedFilename(), bytes: await readFile(path!) };
}

test("merge preserves drag order, supports removal, and downloads a real PDF", async ({ page }) => {
  await page.goto("/tools/merge");
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page.getByLabel("Upload PDFs").setInputFiles([
    { name: "a.pdf", mimeType: "application/pdf", buffer: await pdf(1) },
    { name: "b.pdf", mimeType: "application/pdf", buffer: await pdf(2) },
  ]);
  await expect(page.getByRole("button", { name: "Process files", exact: true })).toBeEnabled();
  const list = page.getByRole("list", { name: "Selected files" });
  await list.locator("li").nth(1).dragTo(list.locator("li").nth(0));
  await expect(list.locator("li").first()).toContainText("b.pdf");
  const output = await download(page);
  const doc = await PDFDocument.load(output.bytes);
  expect(doc.getPages().map((p) => p.getWidth())).toEqual([200, 220, 200]);
  await page.getByRole("button", { name: "Remove file 2" }).click();
  await expect(list.locator("li")).toHaveCount(1);
  await expect(page.getByRole("link", { name: /^Download / })).toHaveCount(0);
});

for (const mode of ["ranges", "every", "single"])
  test(`split ${mode} produces valid PDF downloads`, async ({ page }) => {
    await upload(page, "split");
    await page.getByLabel("Split mode").selectOption(mode);
    if (mode === "ranges") await page.getByLabel("Page range (blank = all)").fill("1-2;3");
    if (mode === "every") await page.getByLabel("Pages per file").fill("2");
    const result = await download(page);
    expect(result.name).toMatch(/\.zip$/);
    const files = Object.values(unzipSync(result.bytes));
    expect(files.length).toBe(mode === "single" ? 3 : 2);
    expect(
      await Promise.all(files.map(async (file) => (await PDFDocument.load(file)).getPageCount())),
    ).toEqual(mode === "single" ? [1, 1, 1] : [2, 1]);
  });

test("thumbnails, keyboard page ordering, rotation and deletion affect the output", async ({
  page,
}) => {
  await upload(page, "organize");
  await page
    .getByRole("list", { name: "PDF pages" })
    .locator("li")
    .first()
    .scrollIntoViewIfNeeded();
  await expect(page.getByLabel("Preview of page 1")).toBeVisible();
  await expect
    .poll(() =>
      page.getByLabel("Preview of page 1").evaluate((c) => (c as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(1);
  await page.getByRole("button", { name: "Move page 3 up" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Rotate page 3" }).click();
  await page.getByRole("button", { name: "Delete page 1" }).click();
  const result = await download(page),
    doc = await PDFDocument.load(result.bytes);
  expect(doc.getPageCount()).toBe(2);
  expect(doc.getPages().map((p) => p.getWidth())).toEqual([240, 220]);
  expect(doc.getPage(0).getRotation().angle).toBe(90);
});

test("deleting every page reports an error and can be restored", async ({ page }) => {
  await upload(page, "delete", await pdf(1));
  await page.getByRole("button", { name: "Delete page 1" }).click();
  await page.getByRole("button", { name: "Process file", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Keep at least one page");
  await page.getByRole("button", { name: "Restore all pages" }).click();
  expect((await PDFDocument.load((await download(page)).bytes)).getPageCount()).toBe(1);
});

for (const slug of ["pdf-to-png", "pdf-to-jpg"])
  test(`${slug} exports a single image and multiple-page ZIP`, async ({ page }) => {
    await upload(page, slug);
    await page.getByLabel("Page range (blank = all)").fill("2");
    const single = await download(page);
    expect(single.name).toMatch(slug === "pdf-to-png" ? /\.png$/ : /\.jpg$/);
    expect([...single.bytes.subarray(0, slug === "pdf-to-png" ? 4 : 3)]).toEqual(
      slug === "pdf-to-png" ? [137, 80, 78, 71] : [255, 216, 255],
    );
    await page.getByLabel("Page range (blank = all)").fill("1-3");
    const multi = await download(page);
    expect(Object.keys(unzipSync(multi.bytes))).toHaveLength(3);
  });

test("multiple PNG/JPG inputs produce PDF pages with size and margins", async ({ page }) => {
  await page.goto("/tools/jpg-to-pdf");
  const png = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 50;
    c.height = 80;
    c.getContext("2d")!.fillRect(0, 0, 50, 80);
    return c.toDataURL("image/png").split(",")[1];
  });
  const jpg = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 70;
    c.height = 40;
    c.getContext("2d")!.fillRect(0, 0, 70, 40);
    return c.toDataURL("image/jpeg").split(",")[1];
  });
  await expect(page.getByLabel("Upload images")).toBeEnabled();
  await page.getByLabel("Upload images").setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: Buffer.from(png, "base64") },
    { name: "b.jpg", mimeType: "image/jpeg", buffer: Buffer.from(jpg, "base64") },
  ]);
  await page.getByLabel("Page size").selectOption("fit");
  await page.getByLabel("Margin (points)").fill("10");
  const result = await download(page),
    doc = await PDFDocument.load(result.bytes);
  expect(doc.getPageCount()).toBe(2);
  expect(doc.getPages().map((p) => [p.getWidth(), p.getHeight()])).toEqual([
    [70, 100],
    [90, 60],
  ]);
});

test("password protection and unlocking round-trip without logging passwords or uploading documents", async ({
  page,
}) => {
  const password = "test-secret-é";
  const logs: string[] = [],
    uploads: string[] = [];
  page.on("console", (msg) => logs.push(msg.text()));
  page.on("request", (request) => {
    if (["POST", "PUT"].includes(request.method())) uploads.push(request.url());
  });
  await upload(page, "protect");
  await page.getByLabel("New PDF password").fill(password);
  const protectedFile = await download(page);
  await expect(PDFDocument.load(protectedFile.bytes)).rejects.toThrow(/encrypted/i);
  await expect(page.getByLabel("New PDF password")).toHaveValue("");
  await upload(page, "unlock", protectedFile.bytes, "protected.pdf");
  await page.getByLabel("Current PDF password").fill("wrong");
  await page.getByRole("button", { name: "Process file", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Check the password");
  await page.getByLabel("Current PDF password").fill(password);
  const unlocked = await download(page);
  expect((await PDFDocument.load(unlocked.bytes)).getPageCount()).toBe(3);
  expect(logs.join("\n")).not.toContain(password);
  expect(uploads).toEqual([]);
});

test("compression presets return valid PDFs, show sizes and preserve original if larger", async ({
  page,
}) => {
  const original = await pdf();
  await upload(page, "compress", original);
  const lossless = await download(page);
  expect((await PDFDocument.load(lossless.bytes)).getPageCount()).toBe(3);
  await expect(page.getByRole("region", { name: "Download results" })).toContainText("Before:");
  await page.getByLabel("Quality preset").selectOption("small");
  await expect(page.getByText("Searchable text, links", { exact: false })).toBeVisible();
  const small = await download(page);
  expect((await PDFDocument.load(small.bytes)).getPageCount()).toBe(3);
  expect(small.bytes.length).toBeLessThanOrEqual(original.length);
});

for (const slug of ["watermark", "page-numbers"])
  test(`${slug} adds readable text to selected pages`, async ({ page }) => {
    await upload(page, slug);
    await page.getByLabel("Page range (blank = all)").fill("2");
    const output = await download(page);
    const texts = await page.evaluate(
      async (bytes) => {
        const modulePath = "/src/lib/pdf-browser.ts";
        const { openPreview } = await import(modulePath);
        const doc = await openPreview(
          new File([new Uint8Array(bytes)], "result.pdf", { type: "application/pdf" }),
        );
        try {
          return await Promise.all(
            Array.from({ length: doc.numPages }, async (_, i) => {
              const p = await doc.getPage(i + 1);
              const content = await p.getTextContent();
              return content.items.map((item: { str?: string }) => item.str ?? "").join(" ");
            }),
          );
        } finally {
          await doc.loadingTask.destroy();
        }
      },
      [...output.bytes],
    );
    expect(texts[1]).toContain(slug === "watermark" ? "CONFIDENTIAL" : "2 / 3");
    expect(texts[0]).not.toContain(slug === "watermark" ? "CONFIDENTIAL" : "1 / 3");
  });

test("invalid uploads and ranges display actionable errors", async ({ page }, testInfo) => {
  await page.goto("/tools/split");
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page.getByLabel("Upload PDFs").setInputFiles({
    name: "fake.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a pdf"),
  });
  await expect(page.getByRole("alert")).toContainText("signature");
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  const largeFile = testInfo.outputPath("huge.pdf");
  await writeFile(largeFile, Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(51 * 1024 * 1024)]));
  await page.getByLabel("Upload PDFs").setInputFiles(largeFile);
  await expect(page.getByRole("alert")).toContainText("maximum file size");
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page
    .getByLabel("Upload PDFs")
    .setInputFiles({ name: "good.pdf", mimeType: "application/pdf", buffer: await pdf() });
  await page.getByLabel("Page range (blank = all)").fill("9");
  await page.getByRole("button", { name: "Process file", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("within 1–3");
});

test("clear and route changes revoke result URLs; processing can be cancelled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = URL.revokeObjectURL.bind(URL);
    (window as unknown as { revoked: string[] }).revoked = [];
    URL.revokeObjectURL = (url) => {
      (window as unknown as { revoked: string[] }).revoked.push(url);
      original(url);
    };
  });
  await upload(page, "split");
  await download(page);
  const url = await page.getByRole("link", { name: /^Download / }).getAttribute("href");
  await page.getByRole("button", { name: "Clear files" }).click();
  expect(await page.evaluate(() => (window as unknown as { revoked: string[] }).revoked)).toContain(
    url,
  );
  await expect(page.getByRole("list", { name: "Selected files" })).toHaveCount(0);
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page
    .getByLabel("Upload PDFs")
    .setInputFiles({ name: "again.pdf", mimeType: "application/pdf", buffer: await pdf() });
  await expect(page.getByRole("button", { name: "Process file", exact: true })).toBeEnabled();
  await download(page);
  const routeUrl = await page.getByRole("link", { name: /^Download / }).getAttribute("href");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Merge", exact: true })
    .click();
  expect(await page.evaluate(() => (window as unknown as { revoked: string[] }).revoked)).toContain(
    routeUrl,
  );
  await upload(page, "pdf-to-png", await pdf(100));
  await page.getByRole("button", { name: "Process file", exact: true }).click();
  await page.getByRole("button", { name: "Cancel processing" }).click();
  await expect(page.getByText("Processing cancelled.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: /^Download / })).toHaveCount(0);
});

test("mobile navigation, keyboard upload, dark/light/system themes and unknown tools", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Merge", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tools\/merge$/);
  await page.getByRole("button", { name: "Select files" }).focus();
  const chooser = page.waitForEvent("filechooser");
  await page.keyboard.press("Enter");
  await (
    await chooser
  ).setFiles({ name: "one.pdf", mimeType: "application/pdf", buffer: await pdf(1) });
  await expect(page.getByRole("list", { name: "Selected files" })).toContainText("one.pdf");
  await page.getByLabel("Color theme").selectOption("light");
  await expect(page.locator("html")).toHaveClass("light");
  await page.reload();
  await expect(page.locator("html")).toHaveClass("light");
  await page.getByLabel("Color theme").selectOption("dark");
  await expect(page.locator("html")).toHaveClass("dark");
  await page.emulateMedia({ colorScheme: "light" });
  await page.getByLabel("Color theme").selectOption("system");
  await expect(page.locator("html")).toHaveClass("light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  const response = await page.goto("/tools/not-a-tool");
  expect(response?.status()).toBe(404);
});
