import { test, expect } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { unzipSync } from "fflate";
import { readFile } from "node:fs/promises";

test("static repository subpath loads, merges and splits with no console or request errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => errors.push(`Request failed: ${request.url()}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`);
  });
  const source = await PDFDocument.create();
  source.addPage([100, 200]);
  const buffer = Buffer.from(await source.save());
  await page.goto("/pdf-command-center/");
  await expect(page.getByRole("heading", { name: /PDF Tools/ })).toBeVisible();
  await page.getByRole("link", { name: "Merge PDF", exact: true }).first().click();
  await expect(page).toHaveURL(/\/pdf-command-center\/tools\/merge$/);
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page.getByLabel("Upload PDFs").setInputFiles([
    { name: "a.pdf", mimeType: "application/pdf", buffer },
    { name: "b.pdf", mimeType: "application/pdf", buffer },
  ]);
  await page.getByRole("button", { name: "Process files", exact: true }).click();
  const mergeLink = page.getByRole("link", { name: /^Download / });
  await expect(mergeLink).toBeVisible();
  let pending = page.waitForEvent("download");
  await mergeLink.click();
  const merged = await readFile((await (await pending).path())!);
  expect((await PDFDocument.load(merged)).getPageCount()).toBe(2);
  const response = await page.goto("/pdf-command-center/tools/split/");
  expect(response?.status()).toBe(200);
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page
    .getByLabel("Upload PDFs")
    .setInputFiles({ name: "merged.pdf", mimeType: "application/pdf", buffer: merged });
  await expect(page.getByRole("button", { name: "Process file", exact: true })).toBeEnabled();
  await page.getByLabel("Split mode").selectOption("single");
  await page.getByRole("button", { name: "Process file", exact: true }).click();
  const splitLink = page.getByRole("link", { name: /^Download / });
  await expect(splitLink).toBeVisible();
  pending = page.waitForEvent("download");
  await splitLink.click();
  const split = await readFile((await (await pending).path())!);
  expect(Object.keys(unzipSync(split))).toHaveLength(2);
  expect(errors).toEqual([]);
});

test("production renderer and password worker load from the repository subpath", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const source = await PDFDocument.create();
  source.addPage([100, 200]);
  const buffer = Buffer.from(await source.save());
  await page.goto("/pdf-command-center/tools/pdf-to-png/");
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page
    .getByLabel("Upload PDFs")
    .setInputFiles({ name: "sample.pdf", mimeType: "application/pdf", buffer });
  await expect(page.getByRole("button", { name: "Process file", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Process file", exact: true }).click();
  await expect(page.getByRole("link", { name: /^Download .*\.png/ })).toBeVisible();
  await page.goto("/pdf-command-center/tools/protect/");
  await expect(page.getByLabel("Upload PDFs")).toBeEnabled();
  await page
    .getByLabel("Upload PDFs")
    .setInputFiles({ name: "sample.pdf", mimeType: "application/pdf", buffer });
  await page.getByLabel("New PDF password").fill("static-test-password");
  await page.getByRole("button", { name: "Process file", exact: true }).click();
  await expect(page.getByRole("link", { name: /^Download / })).toBeVisible({ timeout: 30000 });
  expect(errors).toEqual([]);
});
