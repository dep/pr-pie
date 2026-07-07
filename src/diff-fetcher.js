(() => {
  function parseDiff(text) {
    const files = [];
    let current = null;
    for (const line of text.split('\n')) {
      const header = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (header) {
        current = { path: header[2], additions: 0, deletions: 0, binary: false };
        files.push(current);
        continue;
      }
      if (!current) continue;
      if (line.startsWith('Binary files ') || line === 'GIT binary patch') {
        current.binary = true;
      } else if (line.startsWith('+') && !line.startsWith('+++')) {
        current.additions++;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        current.deletions++;
      }
    }
    return files;
  }

  function prDiffUrl(href) {
    const m = href.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+)(\/|$|#|\?)/);
    return m ? `${m[1]}.diff` : null;
  }

  const cache = new Map();

  function fetchPrDiff(href) {
    const url = prDiffUrl(href);
    if (!url) return Promise.reject(new Error(`not a PR URL: ${href}`));
    if (!cache.has(url)) {
      const promise = fetch(url, { credentials: 'same-origin' })
        .then((res) => {
          if (!res.ok) throw new Error(`diff fetch failed: HTTP ${res.status}`);
          return res.text();
        })
        .then(parseDiff)
        .catch((err) => {
          cache.delete(url);
          throw err;
        });
      cache.set(url, promise);
    }
    return cache.get(url);
  }

  const api = { parseDiff, prDiffUrl, fetchPrDiff };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.PRPie = Object.assign(globalThis.PRPie || {}, api);
})();
