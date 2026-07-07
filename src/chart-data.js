(() => {
  const MAX_SLICES = 8;
  const MIN_PERCENT = 1;

  function aggregate(files, classify) {
    const byCategory = new Map();
    for (const f of files) {
      const category = classify(f.path);
      const row = byCategory.get(category) ||
        { category, additions: 0, deletions: 0, files: 0, weight: 0 };
      row.additions += f.additions;
      row.deletions += f.deletions;
      row.files += 1;
      row.weight += f.binary ? 1 : Math.max(f.additions + f.deletions, 1);
      byCategory.set(category, row);
    }

    const other = byCategory.get('Other') ||
      { category: 'Other', additions: 0, deletions: 0, files: 0, weight: 0 };
    byCategory.delete('Other');

    const rows = [...byCategory.values()].sort((a, b) => b.weight - a.weight);
    const total = rows.reduce((sum, r) => sum + r.weight, other.weight);
    if (total === 0) return [];

    const needsOther = other.files > 0 || rows.length > MAX_SLICES;
    const limit = needsOther ? MAX_SLICES - 1 : MAX_SLICES;
    const keep = [];
    for (const row of rows) {
      const tiny = (row.weight / total) * 100 < MIN_PERCENT;
      if (keep.length < limit && !tiny) {
        keep.push(row);
      } else {
        other.additions += row.additions;
        other.deletions += row.deletions;
        other.files += row.files;
        other.weight += row.weight;
      }
    }
    if (other.files > 0) keep.push(other);
    return keep.map((row) => ({ ...row, percent: (row.weight / total) * 100 }));
  }

  const api = { aggregate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.PRPie = Object.assign(globalThis.PRPie || {}, api);
})();
