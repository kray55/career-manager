// Career Manager - Firefox Extension Content Script
// Detects job listings on pages and injects a "Save to Career Manager" button

(function () {
  'use strict';

  let apiBaseUrl = '';

  // Load API URL from storage
  browser.storage.sync.get('apiUrl').then(({ apiUrl }) => {
    apiBaseUrl = (apiUrl || '').replace(/\/+$/, '');
  });

  // Create the floating save button
  const btn = document.createElement('div');
  btn.id = 'cm-save-btn';
  btn.innerHTML = `
    <style>
      #cm-save-btn {
        position: fixed; bottom: 20px; right: 20px; z-index: 999999;
        background: linear-gradient(135deg, #6366f1, #4f46e5);
        color: white; border: none; border-radius: 50%;
        width: 48px; height: 48px; cursor: pointer;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s, box-shadow 0.2s;
        font-size: 20px;
      }
      #cm-save-btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.6); }
      #cm-save-btn svg { width: 24px; height: 24px; }
      #cm-save-btn .tooltip {
        position: absolute; right: 56px; top: 50%; transform: translateY(-50%);
        background: #0f172a; color: #e2e8f0; padding: 6px 12px; border-radius: 6px;
        font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none;
        transition: opacity 0.2s; font-family: -apple-system, sans-serif;
      }
      #cm-save-btn:hover .tooltip { opacity: 1; }
      #cm-save-toast {
        position: fixed; bottom: 80px; right: 20px; z-index: 999999;
        background: #0f172a; color: #34d399; border: 1px solid #34d399;
        padding: 8px 16px; border-radius: 8px; font-size: 13px;
        font-family: -apple-system, sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        opacity: 0; transition: opacity 0.3s; pointer-events: none;
      }
      #cm-save-toast.show { opacity: 1; }
    </style>
    <div class="tooltip">Save to Career Manager</div>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
    </svg>
    <div id="cm-save-toast"></div>
  `;
  document.body.appendChild(btn);

  const toast = document.getElementById('cm-save-toast');
  function showToast(msg, isError = false) {
    toast.textContent = msg;
    toast.style.color = isError ? '#f87171' : '#34d399';
    toast.style.borderColor = isError ? '#f87171' : '#34d399';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  btn.addEventListener('click', async () => {
    if (!apiBaseUrl) { showToast('Set portal URL in extension settings', true); return; }
    try {
      const res = await fetch(apiBaseUrl + '/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: document.title, url: window.location.href, description: '' }),
        credentials: 'include',
      });
      if (res.ok) showToast('✓ Saved to Career Manager!');
      else { const err = await res.json(); showToast('✗ ' + (err.error || 'Failed'), true); }
    } catch (err) { showToast('✗ Connection error', true); }
  });

  // Also ping the portal to verify connection on page load
  if (apiBaseUrl) {
    fetch(apiBaseUrl + '/api/bookmarks?limit=1', { credentials: 'include' }).catch(() => {});
  }
})();
