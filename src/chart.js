(() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const TAU = Math.PI * 2;

  // dataviz-validated against GitHub surfaces #ffffff / #0d1117 — keep order, don't edit
  const PALETTE = {
    light: ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'],
    dark: ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'],
  };
  // stable colors for role categories across PRs; languages take free slots by weight
  const FIXED_SLOTS = { Docs: 0, Config: 2, Tests: 3, Assets: 4, Styles: 6 };
  const OTHER_COLOR = '#898781';

  function isDarkMode() {
    const mode = document.documentElement.getAttribute('data-color-mode');
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function assignColors(rows, colors) {
    const used = new Set(
      rows.map((r) => FIXED_SLOTS[r.category]).filter((s) => s !== undefined)
    );
    const free = colors.map((_, i) => i).filter((i) => !used.has(i));
    return rows.map((row) => {
      if (row.category === 'Other') return { ...row, color: OTHER_COLOR };
      const slot = FIXED_SLOTS[row.category] !== undefined ? FIXED_SLOTS[row.category] : free.shift();
      return { ...row, color: colors[slot] };
    });
  }

  function arcPath(cx, cy, rOuter, rInner, start, end) {
    if (end - start >= TAU) end = start + TAU - 0.0001;
    const pt = (r, a) => `${(cx + r * Math.cos(a)).toFixed(3)} ${(cy + r * Math.sin(a)).toFixed(3)}`;
    const large = end - start > Math.PI ? 1 : 0;
    return [
      `M ${pt(rOuter, start)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${pt(rOuter, end)}`,
      `L ${pt(rInner, end)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${pt(rInner, start)}`,
      'Z',
    ].join(' ');
  }

  const formatPercent = (p) => (p < 1 ? '<1%' : `${Math.round(p)}%`);
  const filesLabel = (n) => `${n} file${n === 1 ? '' : 's'}`;

  function buildDonut(rows) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '120');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Changes by type');
    let angle = -Math.PI / 2;
    for (const row of rows) {
      const sweep = (row.percent / 100) * TAU;
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', arcPath(60, 60, 56, 34, angle, angle + sweep));
      path.setAttribute('fill', row.color);
      path.classList.add('pr-pie-slice');
      path.dataset.category = row.category;
      const title = document.createElementNS(SVG_NS, 'title');
      title.textContent =
        `${row.category}: ${formatPercent(row.percent)} — ` +
        `+${row.additions} −${row.deletions}, ${filesLabel(row.files)}`;
      path.appendChild(title);
      svg.appendChild(path);
      angle += sweep;
    }
    return svg;
  }

  function buildLegend(rows) {
    const ul = document.createElement('ul');
    ul.className = 'pr-pie-legend';
    for (const row of rows) {
      const li = document.createElement('li');
      li.dataset.category = row.category;

      const swatch = document.createElement('span');
      swatch.className = 'pr-pie-swatch';
      swatch.style.background = row.color;

      const label = document.createElement('span');
      label.className = 'pr-pie-label';
      label.textContent = row.category;

      const percent = document.createElement('span');
      percent.className = 'pr-pie-percent';
      percent.textContent = formatPercent(row.percent);

      const adds = document.createElement('span');
      adds.className = 'pr-pie-adds';
      adds.textContent = `+${row.additions}`;

      const dels = document.createElement('span');
      dels.className = 'pr-pie-dels';
      dels.textContent = `−${row.deletions}`;

      const count = document.createElement('span');
      count.className = 'pr-pie-count';
      count.textContent = `· ${filesLabel(row.files)}`;

      li.append(swatch, label, percent, adds, dels, count);
      ul.appendChild(li);
    }
    return ul;
  }

  function setActive(root, category) {
    for (const el of root.querySelectorAll('[data-category]')) {
      el.classList.toggle('is-active', el.dataset.category === category);
      el.classList.toggle('is-dimmed', category !== null && el.dataset.category !== category);
    }
  }

  function wireHover(root) {
    for (const el of root.querySelectorAll('[data-category]')) {
      el.addEventListener('mouseenter', () => setActive(root, el.dataset.category));
      el.addEventListener('mouseleave', () => setActive(root, null));
    }
  }

  function buildChart(rows) {
    const colors = PALETTE[isDarkMode() ? 'dark' : 'light'];
    const colored = assignColors(rows, colors);
    const root = document.createElement('div');
    root.className = 'pr-pie-chart';
    root.append(buildDonut(colored), buildLegend(colored));
    wireHover(root);
    return root;
  }

  const api = { buildChart };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else globalThis.PRPie = Object.assign(globalThis.PRPie || {}, api);
})();
