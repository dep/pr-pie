# PR Pie — Design Spec

**Date:** 2026-07-07
**Status:** Approved

## Summary

PR Pie is a Chrome extension (Manifest V3) that injects a collapsible panel at the top
of a GitHub pull request diff view (`/pull/<n>/files` and `/pull/<n>/changes`) showing
a donut chart of the PR's changes broken down by file category — so a reviewer knows at
a glance that, e.g., 30% of a PR is markdown and 40% is tests.

## Decisions

| Question | Decision |
|---|---|
| Slice weighting | Lines changed (additions + deletions), not file count |
| Classification | Role-first built-in rules (tests/docs/config/assets/styles), then language by extension |
| Data source | Fetch the PR's `.diff` URL using the browser session (works on private repos, no token). *Revised during verification:* the fetch runs in a background service worker — GitHub 302-redirects `.diff` to `patch-diff.githubusercontent.com`, which serves no CORS headers, so content-script fetch fails; worker host permissions bypass CORS |
| Interactivity | Donut + legend with hover highlighting and exact counts; collapsible; no filtering |
| Stack | Vanilla JS, no build step, no dependencies; hand-rolled SVG donut |

## Architecture

Content-script modules loaded in order via `manifest.json`, plus one stylesheet and a
minimal background service worker (`src/background.js`) whose sole job is fetching the
`.diff` cross-origin (see Data source revision above). The manifest also matches all of
`https://github.com/*` rather than only PR URLs: GitHub's Turbo SPA swaps the page body
without a reload, so a narrower match would never inject on client-side navigation into
a PR.

### 1. `src/diff-fetcher.js`

- Builds `https://github.com/<owner>/<repo>/pull/<n>.diff` from the current PR URL and
  fetches it (same-origin; the user's session cookies authorize private repos).
- Parses the unified diff into `[{ path, additions, deletions, binary }]`:
  - `diff --git a/<old> b/<new>` headers delimit files; use the `b/` path (falls back to
    `a/` path for deletions).
  - Count lines starting with `+` / `-` (excluding `+++` / `---` headers).
  - Binary files ("Binary files ... differ" / "GIT binary patch") get `binary: true` and
    are weighted as 1 unit each so images still appear in the chart.
  - Unknown line types are skipped, never fatal.
- Caches the parsed result in-memory keyed by PR URL so tab switches within a PR don't
  refetch.

### 2. `src/classifier.js`

Pure function `classify(path) → category`. Rules evaluated in order; first match wins:

1. **Tests** — filename contains `.test.` or `.spec.`, or path contains a `__tests__/`,
   `spec/`, or `test/`/`tests/` directory segment.
2. **Docs** — `.md`, `.mdx`, `.rst`, `.txt`, or path under `docs/`.
3. **Config** — `.json`, `.yml`, `.yaml`, `.toml`, `.ini`, lockfiles
   (`package-lock.json`, `yarn.lock`, `Gemfile.lock`, etc.), dotfiles, `*.config.js`.
4. **Images/Assets** — `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`, `.ico`, fonts
   (`.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`).
5. **Styles** — `.css`, `.scss`, `.sass`, `.less`.
6. **Code by language** — remaining files bucketed by extension: JavaScript (`.js`,
   `.jsx`, `.mjs`, `.cjs`), TypeScript (`.ts`, `.tsx`), Ruby (`.rb`, `.rake`, `.erb`,
   `Gemfile`, `Rakefile`), Python, Go, Java, Shell, HTML, SQL, etc.
7. **Other** — fallback for anything unmatched.

### 3. `src/chart.js`

- Input: `[{ category, additions, deletions, files }]` totals; output: a DOM node
  containing the SVG donut and a legend.
- Donut slices sized by `additions + deletions` share; categories under 1% are merged
  into "Other".
- Legend rows: color swatch, category name, percent, `+adds −dels`, file count.
- Hovering a slice or its legend row highlights both and shows exact numbers.
- Colors: a fixed categorical palette with sufficient contrast in both GitHub light and
  dark themes (uses `prefers-color-scheme` / GitHub's `data-color-mode` for
  text/background, palette itself works on both).

### 4. `src/content.js` (entry)

- Detects PR diff pages by URL pattern (`/pull/<n>/files` or `/pull/<n>/changes`).
- Handles GitHub SPA navigation: listens for `turbo:load` / `pjax:end` and falls back to
  a `MutationObserver` watching for URL changes, since switching PR tabs doesn't reload
  the page.
- Finds the diff container anchor and mounts the panel above the first diff; injection
  is idempotent (checks for an existing panel by id, removes stale panels on
  navigation).
- Panel header: "Changes by type" + collapse chevron. Collapsed state persists in
  `chrome.storage.local` (global, not per-repo).

### Manifest

- MV3. `content_scripts` matched to `https://github.com/*/pull/*` (all frames: false),
  scripts in dependency order, one CSS file.
- Permissions: `storage` only. No host permissions beyond the content-script match.
- Scope: github.com only (no GitHub Enterprise domains).

## Error handling

- `.diff` fetch failure (rate limit, GitHub refusing oversized diffs): panel renders a
  one-line "Couldn't load diff data" note; the page is never broken.
- Anchor element not found (GitHub markup change): extension logs to console and does
  nothing visible.
- Parser skips unrecognized diff lines rather than throwing.

## Testing

- `classifier.js` and the diff parser are pure functions; unit tests use Node's built-in
  `node:test` runner (no dependencies). Fixtures include a real-world diff sample with
  binary files, renames, and deletions.
- Chart rendering and injection verified manually against real PRs: Invoca/Titan#6558
  (private, mixed file types) and a large public PR (lazy-load case).

## Out of scope (YAGNI)

- GitHub Enterprise domains
- User-configurable category rules / options page
- Click-to-filter of the file tree or diffs
- File-count weighting toggle
- Firefox/Safari ports
