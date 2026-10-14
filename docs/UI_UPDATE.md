# PDFBuddy interface update

## Audit before edits

| Area           | Evidence                                                                                                        | Root cause / finding                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero animation | `src/components/home/Hero.tsx`, `src/styles.css` (`float-y`)                                                    | Framer Motion and CSS wrote transforms on the same floating element; progress bars animated layout width. No Framer reduced-motion handling. |
| Explore Tools  | `src/components/home/Hero.tsx`, `src/components/home/CommandCenter.tsx`                                         | Explicit Merge route instead of section link; no tools ID or sticky-header offset.                                                           |
| Layout         | `src/components/layout/{Navbar,Footer,Shell}.tsx`                                                               | Existing shared responsive layout; support link absent.                                                                                      |
| Pricing        | `src/routes/pricing.tsx`                                                                                        | Inert CTAs and preview plans; no checkout.                                                                                                   |
| Branding       | `src/components/brand/Logo.tsx`, `src/assets/pdfbuddy-logo.jpeg`, `public/favicon.svg`, `src/routes/__root.tsx` | Raster logo, separate favicon; no SVG variants, Apple icon or sharing image.                                                                 |

## Changes

- Hero entrance and progress use opacity/transform, with reduced-motion handling. Static positioning/rotation lives on the parent; continuous floating lives on a separate child with `will-change`. No requestAnimationFrame loop to leak. Explore links to `#tools`, scrolls with a navbar offset, and keeps `/tools/merge` as the existing public Merge API.
- Support adds six accessible Radix FAQ items, validated labelled fields, honest demo success/error states, and links in desktop/mobile navigation and footer. `src/services/supportService.ts` is an asynchronous placeholder; nothing is sent, logged or persisted. The user selected `your-email@example.com` as a placeholder. Response time is explicitly unavailable.
- Existing pricing route now offers Free/Pro/Team, monthly/yearly pricing, and inline dummy checkout. `src/services/paymentService.ts` validates card syntax/Luhn/expiry and provides cancellable two-second mock processing without receiving card details. Fields clear before processing. No billing or account entitlements exist.
- SVG document/smile branding uses purple and teal; full, icon and monochrome SVGs live in `public/logo`. Monochrome uses currentColor; navigation/footer use the icon with theme-aware text. Apple PNG is 180×180; sharing PNG is 1200×630. Root head assets respect the Pages base path. No sitemap existed. Known-route Pages output now includes support.
- No new dependencies. Existing components, routes and processing preserved.

## Test checklist

- Explore stays on home, scrolls to the tools grid, and the Merge card opens the existing route.
- Check floating transforms and reduced-motion mode; observe browser frame timing. A virtual browser measurement is not a guarantee of 60 fps on every device.
- Submit valid/invalid support fields; verify success states never claim delivery.
- Validate invalid card, expired date, valid test card, processing state, cleared fields and fake order ID; leave checkout during processing to test cancellation.
- Inspect both pages at 375px, keyboard navigation, light/dark logo contrast and asset dimensions.
- Run typecheck, lint, unit tests, browser tests, standard build and Pages build/static tests.

## Verification notes

Initial browser run exposed a pre-hydration pricing click; the final CTA waits for client readiness. A support label was also normalized to readable title case. Standard and Pages builds pass; type-check passes; lint has zero errors and six existing warnings. Unit coverage adds validation and cancellation cases.

During concurrent browser testing, 119 requestAnimationFrame intervals had a 16.7 ms median, 33.4 ms 95th percentile and about 51.7 fps overall. This confirms usual 60 Hz frame scheduling, not a sustained 60 fps claim. A physical-device Performance panel review remains necessary.

The final development browser run passed all 20 checks, including the four new page checks. All 31 unit tests pass. Initial readiness failures were repaired; later PDF readiness timeouts disappeared after stopping an obsolete lint process that was saturating a CPU core. The mobile theme check now waits for hydration and uses the actual theme control instead of mutating the DOM before hydration.
