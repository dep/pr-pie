(() => {
  const { classify, fetchPrDiff, aggregate, buildChart } = globalThis.PRPie;
  const PANEL_ID = 'pr-pie-panel';
  const DIFF_PAGE = /^\/[^/]+\/[^/]+\/pull\/\d+\/(files|changes)(\/|$)/;
  // verified/corrected against the live site in the manual-verification task
  const ANCHOR_SELECTORS = [
    '#files',                          // classic Files changed view
    '[data-testid="diff-view"]',       // new Changes view (guess — verify)
  ];

  function note(text) {
    const p = document.createElement('p');
    p.className = 'pr-pie-note';
    p.textContent = text;
    return p;
  }

  function setCollapsed(panel, collapsed, persist = true) {
    panel.classList.toggle('is-collapsed', collapsed);
    panel.querySelector('.pr-pie-header').setAttribute('aria-expanded', String(!collapsed));
    if (persist) chrome.storage.local.set({ collapsed });
  }

  function buildPanelShell() {
    const panel = document.createElement('section');
    panel.id = PANEL_ID;

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'pr-pie-header';
    header.setAttribute('aria-expanded', 'true');

    const chevron = document.createElement('span');
    chevron.className = 'pr-pie-chevron';
    chevron.textContent = '▾';
    header.append(chevron, document.createTextNode(' Changes by type'));
    header.addEventListener('click', () =>
      setCollapsed(panel, !panel.classList.contains('is-collapsed'))
    );

    const body = document.createElement('div');
    body.className = 'pr-pie-body';
    body.append(note('Loading…'));

    panel.append(header, body);
    chrome.storage.local.get({ collapsed: false }, ({ collapsed }) => {
      if (collapsed) setCollapsed(panel, true, false);
    });
    return panel;
  }

  let mountedPath = '';

  async function render() {
    const path = location.pathname;
    const existing = document.getElementById(PANEL_ID);

    if (!DIFF_PAGE.test(path)) {
      existing?.remove();
      mountedPath = '';
      return;
    }
    if (existing && mountedPath === path) return;
    existing?.remove();

    const anchor = ANCHOR_SELECTORS
      .map((sel) => document.querySelector(sel))
      .find(Boolean);
    if (!anchor) return; // diff view not rendered yet; observer will retry

    const panel = buildPanelShell();
    anchor.prepend(panel);
    mountedPath = path;

    try {
      const files = await fetchPrDiff(location.href);
      const rows = aggregate(files, classify);
      panel.querySelector('.pr-pie-body').replaceChildren(
        rows.length ? buildChart(rows) : note('No changes found in this diff.')
      );
    } catch (err) {
      console.warn('[pr-pie]', err);
      panel.querySelector('.pr-pie-body').replaceChildren(note('Couldn't load diff data.'));
    }
  }

  let scheduled = false;
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      render();
    }, 200);
  }

  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('turbo:load', schedule);
  document.addEventListener('pjax:end', schedule);
  schedule();
})();
