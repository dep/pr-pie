const DIFF_URL = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\.diff$/;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== 'pr-pie-fetch-diff') return;
  if (!DIFF_URL.test(msg.url)) {
    sendResponse({ ok: false, error: 'invalid diff URL' });
    return;
  }
  fetch(msg.url, { credentials: 'include' })
    .then((res) => {
      if (!res.ok) throw new Error(`diff fetch failed: HTTP ${res.status}`);
      return res.text();
    })
    .then((text) => sendResponse({ ok: true, text }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));
  return true; // keep the channel open for the async response
});
