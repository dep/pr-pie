# PR Pie

Chrome extension that shows a donut chart at the top of a GitHub pull request's
diff view ("Files changed" / "Changes"), breaking the PR down by file type —
tests, docs, config, assets, styles, and languages — weighted by lines changed.

## Install (unpacked)

1. `chrome://extensions` → enable Developer mode
2. "Load unpacked" → select this directory
3. Open any PR's Files changed tab on github.com

## How it works

- A background service worker fetches the PR's `.diff` using your existing
  GitHub session (works on private repos, no token needed). GitHub redirects
  `.diff` URLs to `patch-diff.githubusercontent.com`, which blocks page-context
  fetches via CORS — host permissions on the worker are what make this work.
- Classifies each file role-first (tests, docs, config, assets, styles), then by
  language extension; binary files count as 1 unit.
- Renders a donut + legend; hover for exact counts. Collapse state persists.

## Development

No build step. Edit, then reload the extension at `chrome://extensions`.

Run tests: `npm test` (Node ≥ 20, uses the built-in test runner)
