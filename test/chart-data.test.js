const { test } = require('node:test');
const assert = require('node:assert/strict');
const { aggregate } = require('../src/chart-data.js');

const byExt = (path) => (path.endsWith('.md') ? 'Docs' : path.endsWith('.test.js') ? 'Tests' : 'JavaScript');

test('totals per category, sorted by weight descending', () => {
  const rows = aggregate(
    [
      { path: 'a.js', additions: 10, deletions: 5, binary: false },
      { path: 'b.js', additions: 20, deletions: 5, binary: false },
      { path: 'c.test.js', additions: 50, deletions: 0, binary: false },
      { path: 'd.md', additions: 8, deletions: 2, binary: false },
    ],
    byExt
  );
  assert.deepEqual(
    rows.map((r) => [r.category, r.weight, r.files]),
    [['Tests', 50, 1], ['JavaScript', 40, 2], ['Docs', 10, 1]]
  );
  assert.equal(rows[0].percent, 50);
});

test('binary files weigh 1', () => {
  const rows = aggregate(
    [{ path: 'x.js', additions: 0, deletions: 0, binary: true }],
    () => 'Assets'
  );
  assert.deepEqual(rows.map((r) => [r.category, r.weight, r.percent]), [['Assets', 1, 100]]);
});

test('zero-change non-binary files still weigh 1', () => {
  const rows = aggregate(
    [{ path: 'x.js', additions: 0, deletions: 0, binary: false }],
    () => 'JavaScript'
  );
  assert.equal(rows[0].weight, 1);
});

test('categories under 1% merge into Other', () => {
  const rows = aggregate(
    [
      { path: 'big.js', additions: 995, deletions: 0, binary: false },
      { path: 'tiny.md', additions: 5, deletions: 0, binary: false },
    ],
    byExt
  );
  assert.deepEqual(rows.map((r) => r.category), ['JavaScript', 'Other']);
  assert.equal(rows[1].weight, 5);
});

test('more than 8 categories overflow into Other', () => {
  const files = Array.from({ length: 10 }, (_, i) => ({
    path: `f${i}`, additions: 100 - i, deletions: 0, binary: false,
  }));
  const rows = aggregate(files, (path) => `Cat${path}`);
  assert.equal(rows.length, 8);
  assert.equal(rows[7].category, 'Other');
  assert.equal(rows[7].files, 3);
});

test('classifier Other merges with overflow Other', () => {
  const rows = aggregate(
    [
      { path: 'a.js', additions: 90, deletions: 0, binary: false },
      { path: 'LICENSE', additions: 10, deletions: 0, binary: false },
    ],
    (path) => (path === 'LICENSE' ? 'Other' : 'JavaScript')
  );
  assert.deepEqual(rows.map((r) => [r.category, r.percent]), [['JavaScript', 90], ['Other', 10]]);
});

test('percentages sum to 100', () => {
  const files = Array.from({ length: 5 }, (_, i) => ({
    path: `f${i}.js`, additions: i + 1, deletions: 0, binary: false,
  }));
  const rows = aggregate(files, (p) => p);
  const sum = rows.reduce((s, r) => s + r.percent, 0);
  assert.ok(Math.abs(sum - 100) < 1e-9);
});

test('empty input returns empty array', () => {
  assert.deepEqual(aggregate([], byExt), []);
});
