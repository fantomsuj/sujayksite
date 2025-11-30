# Personal Site Replication Guide

Use this checklist to recreate the current GitHub Pages setup from a fresh Framer export.

## Steps
- **Export from Framer:** Download the static export (HTML + assets).
- **Flatten the export:** Move all exported files/folders from the Framer UUID directory into the repo root (or `docs/` if you configure Pages that way). Remove the empty UUID folder afterward.
- **Custom domain:** Ensure `CNAME` in the repo root contains `sujaykolpuru.com`.
- **Hide Portfolio nav:** Add `<style>.framer-127bies{display:none!important}</style>` near the top of each page (`index.html`, `about/page.html`, `love/page.html`, `now/page.html`) to hide the “Portfolio” link that Framer emits.
- **Align header:** Add a shared override style near the head to make the header full-width, centered, and sticky:
  ```html
  <style>
  .framer-Y1hfi .framer-ifyz1h{
    position:sticky;top:0;left:0;width:100%;height:auto;
    padding:24px 36px;background:#000;align-items:center;
    flex-flow:column;gap:24px;
  }
  .framer-2hREC.framer-1ajiwgs,
  .framer-2hREC.framer-v-1cyy1wq.framer-1ajiwgs,
  .framer-2hREC.framer-v-11kkpzr.framer-1ajiwgs{
    width:100%;max-width:1100px;margin:0 auto;
    justify-content:space-between;align-items:center;
  }
  </style>
  ```
- **Now page content:** In `now/page.html`, append custom content right after `<div id="main"></div>` (e.g., the current “Now” section with curiosities and podcasts).
- **Push to GitHub:** Commit and push to `main`. In GitHub settings, set Pages source to the repo root (or `docs/` if used). Confirm DNS for the custom domain points to GitHub Pages.

## Quick verification
- Open `index.html` locally (or via `python3 -m http.server`) and confirm the header is centered and “Portfolio” is hidden.
- Navigate to `/now` and verify the custom “Now” section renders.

## Notes
- Keep overrides minimal so a future Framer re-export only needs these small CSS snippets and the custom “Now” block.
- If you change the nav layout in Framer, you may need to adjust the CSS selectors above to match new class names.
