# Audit and repair report

Scope: the existing PDFBuddy repository. Public routes were preserved. The original UI remains the baseline; the upload-only tool screens now connect to client-side processing. No PDF API, database or external AI API was invented.

## Baseline audit

The initial application used React, TanStack Start/Router, Vite, Tailwind and a Lovable configuration preset. `src/server.ts` wrapped SSR failures; `src/router.tsx` loaded generated file routes; `ToolPage` rendered one generic upload component for every tool slug. No PDF library or processing/download pipeline existed. AI, dashboard, login, pricing and contact were scaffolds.

| Check                             | Initial result                     | Exact failure or finding                                                                                                                                                                      |
| --------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen install                    | Failed                             | `error: GET https://europe-west1-npm.pkg.dev/lovable-core-prod/sandbox-npm-cache/framer-motion/-/framer-motion-12.40.0.tgz - 403`; same error for motion-dom 12.40.0 and motion-utils 12.39.0 |
| Build                             | Passed after installation recovery | Client and Cloudflare server outputs generated                                                                                                                                                |
| Type check after route generation | Failed                             | `src/components/home/Hero.tsx(34,19): error TS2322: Type '"/tools/merge"' is not assignable to type …`                                                                                        |
| Lint                              | Failed                             | `101 problems (95 errors, 6 warnings)`; errors were Prettier formatting, warnings Fast Refresh mixed exports                                                                                  |
| Tests                             | Missing                            | `npm error Missing script: "test"`; no source test files                                                                                                                                      |
| Dependency audit                  | Failed                             | `64 vulnerabilities (2 critical, 34 high, 20 moderate, 8 low)`                                                                                                                                |

Baseline uploads accepted any first file without size/signature checks. No document processing, temporary server storage or PDF-buffer leak was demonstrated because those facilities did not exist. A process-global error buffer could misattribute concurrent SSR errors. Inspected source/config matched none of the credential patterns checked; Git history was not exhaustively scanned.

## 1. Toolchain, build and dependency repairs

**Problem/root cause:** private artifact URLs, stale vulnerable transitives, an invalid typed dynamic link and formatting failures. Updated TanStack packages require Vite 8. The Lovable preset's optional tagging dependency also retained vulnerable build tooling and no longer provided the original Cloudflare integration.

**Fix:** update compatible packages, pin patched transitive overrides, replace the preset with the already-declared official Vite/React/TanStack/Tailwind/Cloudflare plugins, use native Vite path resolution, and preserve Cloudflare as an optional build target. Locked artifacts now use public npm. Keep the existing 24-hour release-age policy without unused exceptions. Correct dynamic links in Hero/footer/navigation and catch router invalidation failures. Format existing files to the repository's Prettier rules.

**Files:** `package.json`, `bun.lock`, `bunfig.toml`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, generated `src/routeTree.gen.ts`, router/root files, Hero/footer, plus formatting-only changes in existing components/routes.

**Validation:** frozen installation, type check, lint, both builds and package audit. Audit reports no vulnerabilities. Six original Fast Refresh warnings remain; no lint errors. Generated third-party assets, build/test output and generated route code are excluded from lint; assertions remain enabled.

## 2. Validated upload and bounded lifecycle

**Problem/root cause:** a single unchecked File object and misleading 100MB/deletion claims.

**Fix:** configurable 50MB default, `%PDF-` signature and extension validation, PNG/JPG signatures, empty-file rejection, 30-file/100MB aggregate limits, PNG pixel-header checks, 300-page manipulation/rendering limits, 16-million-pixel rendering/image limits, and 100MB output limits. The native picker remains disabled until hydration attaches handlers. Batch validation is atomic; stale asynchronous uploads cannot replace newer selections.

**Files:** `src/lib/upload.ts`, `src/lib/pdf-types.ts`, `UploadZone.tsx`, `PDFWorkspace.tsx`.

**Validation:** unit boundary/error cases, a real 51MB browser fixture, fake-PDF rejection, invalid page ranges and oversized PNG headers.

## 3. Merge and split

**Problem/root cause:** tool cards had no processing engine, ordered file list or range controls.

**Fix:** merge displayed file order, add/remove files, HTML drag ordering and keyboard buttons. Split with comma-separated page selection, semicolon-separated output groups, every-N chunks or one PDF per selected page. Multiple outputs become a ZIP; valid remaining chunks are retained.

**Files:** `pdf-engine.ts`, `order.ts`, `PDFWorkspace.tsx`, `pdf.worker.ts`.

**Validation:** generated PDFs verify page counts/dimensions/order, invalid ranges/chunks, merge limits and ZIP contents. Browser downloads are parsed as real PDFs.

## 4. Thumbnail editing, rotation and deletion

**Problem/root cause:** rotate/organize had no page model or previews.

**Fix:** lazily render PDF.js thumbnails, reorder by drag/buttons, rotate in 90-degree steps, delete pages and restore the initial selection. Require at least one output page and reject duplicate/out-of-range indices. Observe a stable thumbnail container instead of a canvas whose cleanup can reduce its dimensions to zero.

**Files:** `PageThumbnail.tsx`, `PDFWorkspace.tsx`, `pdf-browser.ts`, `pdf-engine.ts`, tool catalog.

**Validation:** rendered canvas, keyboard ordering, changed output rotation/order/count, delete-all errors and restoration.

## 5. Compression and image conversion

**Problem/root cause:** conversion/compression were labels without implementations.

**Fix:** QPDF lossless stream optimization; raster presets at 144/110/72 DPI and JPEG quality 85/70/50%. Explicitly disclose text/form/link/accessibility loss. Preserve the original when compression produces a larger file. Export PNG/JPG pages or ZIPs. Embed ordered PNG/JPG inputs into A4, Letter or fitted pages with margins.

**Files:** `pdf-browser.ts`, `pdf-engine.ts`, `pdf.worker.ts`, `zip.worker.ts`, workspace options, PDF.js asset-copy script.

**Validation:** PDF readability/page counts, image signatures, ZIP counts, fitted page dimensions/margins, output sizes and production-subpath renderer loading.

## 6. Protect and unlock

**Problem/root cause:** there were no password controls; pdf-lib does not implement PDF encryption.

**Fix:** add QPDF WASM specifically for AES-256 encryption and password-based decryption. Generate an independent owner secret for protection. Unlock via an in-memory password file. Suppress the generated runtime's logging before importing it, sanitize failures, clear input passwords after processing, unmount/remove temporary files and terminate the entire worker. Do not store credentials or recover forgotten passwords.

**Files:** `pdf.worker.ts`, `PDFWorkspace.tsx`, dependency declarations.

**Validation:** Unicode-password encryption/decryption round trip, encrypted-reader rejection, wrong-password errors, cleared password fields, no password in captured console messages, no POST/PUT document requests, and production WASM loading.

## 7. Watermarks and page numbers

**Problem/root cause:** there was no drawing operation; page numbers were absent from the catalog.

**Fix:** draw centered Latin-text watermarks with size/opacity controls, and original-index page numbers on selected pages. Validate text, ranges and numeric options. Add page-numbers/delete/PNG tools without renaming existing slugs.

**Files:** `pdf-engine.ts`, tool catalog, workspace options.

**Validation:** selected-page content changes, unaffected other pages, Unicode-font error handling and PDF.js text extraction from downloaded output.

## 8. Downloads, progress, cancellation and cleanup

**Problem/root cause:** no output lifecycle or processing state existed.

**Fix:** disposable workers and transferable buffers, bounded ZIP construction in a worker, live/indeterminate progress, explicit errors and cancellation. Destroy PDF.js loading tasks, cancel renders, zero canvases, revoke result URLs on changes/clear/unmount, and release QPDF files with the worker. Remove the process-global SSR last-error buffer; preserve the branded error response without cross-request attribution.

**Files:** browser/worker engines, workspace, thumbnail component, server wrapper; obsolete `error-capture.ts` removed. Its only internal caller was the server wrapper; no public endpoint changed.

**Validation:** cancelled jobs produce no download, clear and SPA route changes revoke URLs, corrupt input errors, read-only rendering checks and SSR builds.

## 9. Responsive UI and honest previews

**Problem/root cause:** mobile navigation disappeared, hidden file labels were not keyboard buttons, theme was fixed, and several pages implied nonexistent services.

**Fix:** accessible mobile navigation and Escape handling, labeled controls, keyboard file/page ordering, dark/light/system themes and reduced-motion styling. Only theme preference is persisted. Serve system fonts/assets locally, provide a favicon, and label AI/auth/billing/dashboard/contact/office conversion as previews. Disable unconnected forms rather than collecting credentials or submitting data to invented endpoints. Update privacy/FAQ claims.

**Files:** navigation/theme components, workspace/upload controls, styles, root/FAQ/privacy/login/contact/AI/dashboard/pricing/tool pages.

**Validation:** 375px viewport without horizontal overflow, keyboard file chooser, navigation, theme persistence/system changes and unknown-tool 404.

## 10. Static deployment and documentation

**Problem/root cause:** the default build targets a server and had no public deployment or README. Copying an empty TanStack SPA shell to direct paths caused a React hydration mismatch.

**Fix:** retain the SSR build and add a Pages mode with `/pdf-command-center/` asset/router base, an SPA shell, known-route indexes and a 404 fallback. In Pages mode mount the empty shell as a client app; retain normal SSR hydration elsewhere. Add an immutable-SHA-pinned workflow with install/type/lint/unit/browser/static gates, then upload only `dist/client/`. Document dependencies/licenses, configuration, privacy, limitations and setup in README. Leave the project license unspecified as requested.

**Files:** `src/client.tsx`, Vite/router configuration, Pages output/static test scripts, `.github/workflows/deploy.yml`, `.env.example`, README and this report.

**Validation:** static build, repository-subpath merge/split/image/password tests and strict console/request checks. Pages source was enabled by the maintainer because the connected integration could read repository metadata but received HTTP 403 for creating the Pages site.

## Validation and limitations

| Command                         | Result                                                        |
| ------------------------------- | ------------------------------------------------------------- |
| `bun install --frozen-lockfile` | Pass, unchanged dependency resolution                         |
| `npm run typecheck`             | Pass, includes source and test configurations                 |
| `npm run lint`                  | Pass: zero errors, six existing Fast Refresh warnings         |
| `npm test`                      | 28 passed; none skipped/disabled                              |
| `npm run test:e2e`              | 16 passed in a complete Chromium run; none skipped/disabled   |
| `npm run build`                 | Pass, original Cloudflare build                               |
| `npm run build:pages`           | Pass, static output                                           |
| `npm run test:pages`            | 2 passed; subpath core workflow has no console/request errors |
| `bun audit`                     | No vulnerabilities reported                                   |

During development, retries diagnosed the Vite major requirement, a breaking global brace-expansion override (removed), missing PDF.js v6 API changes (corrected to `loadingTask.destroy()`), pre-hydration interactions (disabled until ready), the thumbnail observer issue, Playwright's 50MB buffer transport limit (use a disk fixture), and static hydration (use client mounting). A simultaneous build regenerated routes and disrupted one browser run; builds and source-browser checks are now run sequentially. These failed exploratory runs were not counted as passes.

Both SSR and static builds remain distinct from publication. The deployment workflow must succeed before public availability is claimed. The README lists all remaining document-fidelity and browser-coverage limits. There are no file-persistence exceptions; saved user downloads are outside application cleanup.

## Final feature status

| #   | Feature                        | Status  | Remaining limitation                                          |
| --- | ------------------------------ | ------- | ------------------------------------------------------------- |
| 1   | Merge                          | Done    | 30 files/100MB combined/300 pages                             |
| 2   | Split                          | Done    | 300 pages; grouped ranges documented                          |
| 3   | Compress                       | Done    | Raster fidelity tradeoff; no guaranteed reduction             |
| 4   | Rotate/reorder with thumbnails | Done    | Chromium verified; other browsers untested                    |
| 5   | Delete pages                   | Done    | Keep at least one page                                        |
| 6   | PDF to PNG/JPG/ZIP             | Done    | Pixel/output limits                                           |
| 7   | Images to PDF                  | Done    | PNG/JPG only                                                  |
| 8   | Protect/unlock                 | Done    | Correct password required                                     |
| 9   | Watermark/page numbers         | Done    | Latin watermark text and centered placement                   |
| 10  | Validated uploads              | Done    | Configurable 50MB default                                     |
| 11  | Download/cleanup               | Done    | User-saved downloads remain on device                         |
| 12  | Errors/progress                | Done    | Native WASM work uses indeterminate status                    |
| 13  | Responsive/keyboard/dark mode  | Done    | Full assistive-technology audit not performed                 |
| 14  | Custom integrations            | Missing | No custom requirement specified; AI/auth/etc. remain previews |

For new-developer setup, use the verified commands in [README](../README.md). No application credentials or backend are required. Dependency licenses do not grant a project license.
