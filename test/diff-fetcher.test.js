const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseDiff, prDiffUrl } = require('../src/diff-fetcher.js');

const SAMPLE = `diff --git a/src/App.jsx b/src/App.jsx
index 1111111..2222222 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -1,3 +1,4 @@
 import React from 'react';
+import hero from './hero.webp';
-const old = 1;
+const shiny = 2;
@@ -10,2 +11,2 @@ function App() {
 export default App;
diff --git a/images/hero.webp b/images/hero.webp
new file mode 100644
Binary files /dev/null and b/images/hero.webp differ
diff --git a/docs/old.md b/docs/old.md
deleted file mode 100644
index 3333333..0000000
--- a/docs/old.md
+++ /dev/null
@@ -1,2 +0,0 @@
-# Old
-gone
`;

test('parses per-file additions and deletions', () => {
  const files = parseDiff(SAMPLE);
  assert.equal(files.length, 3);
  assert.deepEqual(files[0], { path: 'src/App.jsx', additions: 2, deletions: 1, binary: false });
});

test('flags binary files with zero counted lines', () => {
  const files = parseDiff(SAMPLE);
  assert.deepEqual(files[1], { path: 'images/hero.webp', additions: 0, deletions: 0, binary: true });
});

test('handles deleted files', () => {
  const files = parseDiff(SAMPLE);
  assert.deepEqual(files[2], { path: 'docs/old.md', additions: 0, deletions: 2, binary: false });
});

test('empty or garbage input yields no files', () => {
  assert.deepEqual(parseDiff(''), []);
  assert.deepEqual(parseDiff('not a diff\nat all\n'), []);
});

test('prDiffUrl extracts the PR .diff URL from any PR sub-page', () => {
  assert.equal(
    prDiffUrl('https://github.com/Invoca/Titan/pull/6558/changes'),
    'https://github.com/Invoca/Titan/pull/6558.diff'
  );
  assert.equal(
    prDiffUrl('https://github.com/Invoca/Titan/pull/6558/files#diff-abc'),
    'https://github.com/Invoca/Titan/pull/6558.diff'
  );
  assert.equal(prDiffUrl('https://github.com/Invoca/Titan/issues/1'), null);
});
