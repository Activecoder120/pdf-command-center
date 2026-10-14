# PDFBuddy

A browser-based PDF toolkit for combining, extracting, editing and converting documents without uploading files.

[![Build and deploy](https://github.com/Activecoder120/pdf-command-center/actions/workflows/deploy.yml/badge.svg)](https://github.com/Activecoder120/pdf-command-center/actions/workflows/deploy.yml)
![License: not specified](https://img.shields.io/badge/license-not%20specified-lightgrey)
[![Live demo](https://img.shields.io/badge/live%20demo-GitHub%20Pages-blue)](https://activecoder120.github.io/pdf-command-center/)

**[Open the live demo →](https://activecoder120.github.io/pdf-command-center/)**

<!-- Screenshot/GIF placeholder: add docs/screenshot.png or docs/demo.gif,
     then replace the following line with ![PDFBuddy toolkit](docs/screenshot.png). -->

> Screenshot coming soon.

## Features

- Merge PDFs in drag-and-drop order; add, remove or reorder files with keyboard-accessible buttons.
- Split by page ranges, every N pages, or individual pages. Multiple results download as a ZIP.
- Compress using lossless stream optimization or high, balanced and small raster presets; compare original and result sizes.
- Preview, rotate, reorder and delete pages. Restore the original page selection before processing.
- Export selected PDF pages to PNG/JPG, individually or as a ZIP.
- Combine PNG/JPG images into PDFs with A4, Letter or fitted pages and configurable margins.
- Protect PDFs with AES-256 passwords and unlock PDFs using their current password.
- Add Latin-text watermarks and page numbers to selected pages.
- Validate file signatures and size limits; display errors and processing status; cancel processing.
- Use responsive navigation, keyboard controls and dark, light or system themes.

## Tech stack

React 19, TypeScript, TanStack Start/Router, Vite 8, Tailwind CSS 4 and Radix UI.
The live demo is a static SPA. PDF processing requires **no backend, API endpoints, database or CORS configuration**.
The original Cloudflare Workers build remains available for server-rendered hosting.

New processing and test dependencies:

| Package                   | License                      | Purpose                                                  |
| ------------------------- | ---------------------------- | -------------------------------------------------------- |
| `pdf-lib`                 | MIT                          | Merge, split, edit and generate PDFs                     |
| `pdfjs-dist`              | Apache-2.0                   | Parse/render PDFs and create thumbnails/images           |
| `fflate`                  | MIT                          | ZIP result downloads                                     |
| `@neslinesli93/qpdf-wasm` | ISC wrapper; Apache-2.0 QPDF | Browser encryption, decryption and lossless optimization |
| `@playwright/test`        | Apache-2.0                   | Browser and production-static regression tests           |

QPDF provides encryption capabilities absent from pdf-lib; it does not replace the manipulation or rendering libraries.

## Getting started

Prerequisites: Node.js 24 and Bun 1.3.11. Browser tests require Chromium.

```bash
git clone https://github.com/Activecoder120/pdf-command-center.git
cd pdf-command-center
bun install --frozen-lockfile
npm run dev
```

The development server uses port 5173. Installation copies PDF.js support assets into ignored `public/pdfjs/`; keep lifecycle scripts enabled.

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run build:pages
npm run test:pages
```

`npm test` runs Node's unit tests. Browser tests use `/usr/bin/chromium` when present, `CHROMIUM_PATH` when supplied, or Playwright's installed Chromium.
Both browser test commands manage their own local test server; stop a development server on the same port first.
`test:pages` needs the output from `build:pages`. The Cloudflare and Pages builds replace `dist/`, so run them in the order shown.

## Project structure

```text
.github/workflows/deploy.yml  # Validate, build and publish GitHub Pages
scripts/                     # Copy PDF.js assets and prepare/test static output
src/
  components/tools/          # Uploads, tool options, thumbnails and downloads
  components/layout/         # Shared navigation, theme selection and footer
  lib/pdf-engine.ts          # PDF manipulation and ZIP generation
  lib/pdf-browser.ts         # Rendering, cancellation and worker lifecycle
  lib/pdf.worker.ts          # Disposable manipulation/QPDF worker
  lib/upload.ts              # File signatures and size validation
  routes/                    # Existing TanStack file routes
  router.tsx                 # Routing, including the deployment base path
  client.tsx                 # Static SPA mounting or optional SSR hydration
  server.ts                  # Error wrapper for the optional SSR build
tests/unit/                  # Generated-document and validation tests
tests/e2e/                   # Development-browser tool tests
tests/pages/                 # Production-static subpath tests
public/                      # Static assets; generated PDF.js assets are ignored
docs/REPAIR_REPORT.md         # Audit findings, fixes, tests and feature status
```

## Deployment

[The deployment workflow](.github/workflows/deploy.yml) runs on pushes to `main`, pull requests and manual dispatch.
Actions are pinned to full commit SHAs. Pull requests validate without publishing.
Main-branch builds run type, lint, unit and browser checks, generate the static SPA, test its repository subpath, and publish only `dist/client/` to Pages.

In the repository, select **Settings → Pages → Build and deployment → Source → GitHub Actions**.
To deploy manually, open **Actions → Deploy GitHub Pages → Run workflow** on `main`.
Inspect that workflow's deploy job for the published URL.

`build:pages` sets the Vite/router base to `/pdf-command-center/`, creates `index.html`, copies a SPA fallback to `404.html`, and writes index files for known routes so direct links work.
Rendering fonts, character maps, workers and WASM assets are hosted with the site.
If the repository is renamed, update the base in [vite.config.ts](vite.config.ts), the static test server and README URLs.
Static hosting removes the need for a running server but relies on JavaScript and the user's browser resources.

To set the repository website manually: open the repository page, click the gear beside **About**, enter `https://activecoder120.github.io/pdf-command-center/` in **Website**, and save.

## Configuration

[`.env.example`](.env.example) documents the optional application setting. No credentials are required.
Create `.env.local` with any desired override before building; Vite settings are embedded in the build.

| Variable             | Required | Default       | Description                                                                      |
| -------------------- | -------- | ------------- | -------------------------------------------------------------------------------- |
| `VITE_MAX_UPLOAD_MB` | No       | `50`          | Per-file limit in MB; positive values up to 100. Invalid values fall back to 50. |
| `CHROMIUM_PATH`      | No       | Auto-detected | Path to Chromium for browser tests; does not affect the deployed app.            |

## Privacy and file handling

PDFs, images and passwords stay in browser memory. Processing never sends file contents to a server or saves them in local/session storage.
Workers terminate after completion or cancellation. Temporary files inside QPDF's virtual filesystem are released with the worker.
Download URLs are revoked when inputs/options change, files are cleared, or the tool is left. Closing the page releases remaining memory.
Downloads saved by the user remain on their device; the application cannot delete those files.
Only the color-theme preference is stored locally. No external font service is used.

The default upload limit is **50 MB per file**, with **30 files and 100 MB combined per job**.
Manipulation and rendering support up to **300 pages**. Image inputs/rendered pages are limited to **16 million pixels**, and outputs to **100 MB**.
There is no server retention period because no document is uploaded.

## Known limitations

- Raster compression removes searchable text, links, forms, signatures and accessibility tags. Lossless optimization preserves content but may not reduce size; larger results are replaced with the original.
- Editing a signed PDF invalidates its digital signature. Page copying may not retain document-level bookmarks, form relationships or accessibility structure.
- Watermarks currently use a Latin-character font and a centered placement. Page numbers use the original page index.
- Unlock an encrypted PDF before using manipulation/rendering tools. A correct password is required; forgotten passwords are not recovered.
- Very large or unusual PDFs may exceed browser memory or rendering limits. Some embedded image formats depend on browser/PDF.js support.
- Support requests validate locally only; there is no delivery endpoint. Pricing includes a dummy checkout with no real charges or subscriptions.
- PDF-to-Word, Word-to-PDF, AI, authentication and dashboard metrics remain explicitly labeled previews; they are not implemented services.
- Browser checks currently cover Chromium. Other browsers and assistive technologies need further testing.
- Lint retains existing Fast Refresh warnings in shared UI component modules; they do not prevent builds.

## Roadmap

- Improve preservation of forms, bookmarks and tagged-document structure.
- Add broader browser/accessibility coverage and richer watermark placement.
- Evaluate office conversion and optional integrations separately from the local PDF toolkit.

## Contributing

Open a GitHub issue with steps to reproduce, browser version and a non-sensitive sample when possible.
For a pull request, keep existing routes and APIs stable, describe the change and run the checks above.
Keep processing local, dispose of buffers/workers/download URLs, and never log passwords.
List the license and purpose of any new dependency. Do not commit private documents, credentials or generated build output.
There is currently no separate contribution-guidelines file.

## License

No project license has been specified in this repository. Do not assume a permissive license from the dependency licenses above.
The maintainer must choose a project license before granting reuse/distribution rights.
