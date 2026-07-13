# PR Pie Privacy Policy

_Last updated: July 13, 2026_

PR Pie is a Chrome extension that displays a donut-chart breakdown of a GitHub
pull request's changes by file type. It is designed to work entirely inside
your browser.

## Data collection

**PR Pie does not collect, store, transmit, or sell any user data.**

- No personal information, browsing history, analytics, or telemetry is
  gathered.
- There are no third-party services, trackers, or ad networks.
- The extension has no backend — nothing is ever sent to the developer or
  anyone else.

## How the extension handles data

- When you open a pull request's diff view on github.com, the extension fetches
  that PR's `.diff` file from GitHub using your existing GitHub session. This
  request goes only to GitHub (`github.com` and its download host
  `patch-diff.githubusercontent.com`) — the same place your browser already
  loads the page from.
- The diff text is parsed in memory to compute the chart, then discarded. It is
  never persisted or transmitted anywhere.

## Local storage

The extension stores a single preference — whether you collapsed the chart
panel — using Chrome's local extension storage. This value never leaves your
device and is removed when you uninstall the extension.

## Permissions

- `storage`: persists the collapsed/expanded state of the panel.
- Host access to `github.com` and `patch-diff.githubusercontent.com`: injects
  the chart panel on pull request pages and fetches the PR's diff.

## Changes

If a future version changes how data is handled, this policy will be updated
and the change noted in the extension's release notes.

## Contact

Questions or concerns: open an issue at
<https://github.com/dep/pr-pie/issues>.
