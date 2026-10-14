import { test, expect } from "@playwright/test";
test("Explore Tools scrolls in place and Merge retains its route", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Explore Tools" }).click();
  await expect(page).toHaveURL(/\/#tools$/);
  await expect(page.locator("#tools")).toBeInViewport();
  await page
    .locator("#tools")
    .getByRole("link", { name: /Merge PDF/ })
    .click();
  await expect(page).toHaveURL(/\/tools\/merge/);
});
test("support validates and acknowledges only a demo request", async ({ page }) => {
  await page.goto("/support");
  await page.getByLabel("Name", { exact: true }).fill("Demo User");
  await page.getByLabel("Email", { exact: true }).fill("demo@example.com");
  await page.getByLabel("Subject", { exact: true }).fill("Test");
  await page.getByLabel("Message", { exact: true }).fill("A sufficiently detailed demo request.");
  await page.getByRole("button", { name: "Submit demo request" }).click();
  await expect(page.getByRole("status")).toContainText("No message was sent or stored");
  await expect(page.getByLabel("Message", { exact: true })).toHaveValue("");
});
test("dummy checkout rejects invalid card and clears fields while processing", async ({ page }) => {
  await page.goto("/pricing");
  await page.getByRole("button", { name: "Try Pro demo" }).click();
  await page.getByLabel("Card number", { exact: true }).fill("4242424242424241");
  await page.getByLabel("Expiry (MM/YY)", { exact: true }).fill("12/99");
  await page.getByLabel("CVC", { exact: true }).fill("123");
  await page.getByLabel("Name on card", { exact: true }).fill("Demo");
  await page.getByRole("button", { name: "Pay (demo)" }).click();
  await expect(page.getByRole("alert")).toContainText("validation");
  await page.getByLabel("Card number", { exact: true }).fill("4242424242424242");
  await page.getByRole("button", { name: "Pay (demo)" }).click();
  await expect(page.getByRole("button", { name: "Processing demo…" })).toBeDisabled();
  await expect(page.getByLabel("Card number", { exact: true })).toHaveValue("");
  await expect(page.getByText("Demo payment successful")).toBeVisible();
  await expect(page.getByText(/Fake order ID: DEMO-/)).toBeVisible();
});
test("new pages fit mobile themes and hero cards stay static", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  for (const route of ["/support", "/pricing"]) {
    await page.goto(route);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeEnabled();
    for (const theme of ["light", "dark"]) {
      await page.getByLabel("Color theme").selectOption(theme);
      await expect(page.locator("html")).toHaveClass(theme);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
      const icon = page.locator("header img");
      await expect(icon).toBeVisible();
      expect(
        await icon.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
      ).toBe(true);
    }
  }
  for (const reducedMotion of ["no-preference", "reduce"] as const) {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/");
    const cards = page.getByTestId("hero-pdf-cards").locator(":scope > div > div");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) {
      await expect(card).toHaveCSS("animation-name", "none");
      await expect(card).toHaveCSS("transform", "none");
      expect(await card.evaluate((element) => element.getAnimations().length)).toBe(0);
    }
    const before = await cards.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
    await page.waitForTimeout(250);
    expect(
      await cards.evaluateAll((elements) =>
        elements.map((element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        }),
      ),
    ).toEqual(before);
  }
});
