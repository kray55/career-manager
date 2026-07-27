// ──────────────────────────────────────────────
// Career Manager Sidebar Feed UI (Sprint 7)
// Contextual intelligence feed with filter/search
// ──────────────────────────────────────────────

(function () {
  "use strict";

  // ── State ────────────────────────────────────
  let feedState = {
    domain: "",
    platform: "Monitoring...",
    results: [],
    generic: true,
    timestamp: null,
  };
  let searchTerm = "";
  let sourceFilter = "all";
  let sources = [];
  let pendingHighlight = null;

  // ── DOM References ──────────────────────────
  const $ = (id) => document.getElementById(id);
  const feedList = $("feed-list");
  const emptyState = $("empty-state");
  const loadingState = $("loading-state");
  const platformTag = $("platform-tag");
  const feedCountBadge = $("feed-count-badge");
  const searchInput = $("search-input");
  const sourceFilterEl = $("source-filter");
  const statusText = $("status-text");
  const statusIndicator = $("status-indicator");
  const refreshBtn = $("refresh-btn");
  const prefsBtn = $("prefs-btn");

  // ── Utility ──────────────────────────────────
  function esc(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function timeAgo(ts) {
    if (!ts) return "";
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.floor(hrs / 24) + "d ago";
  }

  function getSources() {
    const srcSet = new Set();
    for (const r of feedState.results) {
      if (r.name) srcSet.add(r.name);
    }
    return Array.from(srcSet).sort();
  }

  // ── Render ───────────────────────────────────
  function render() {
    // Build filtered list
    let allItems = [];
    for (const result of feedState.results) {
      if (!result.items || result.items.length < 1) continue;
      for (const item of result.items) {
        allItems.push({ ...item, _source: result.name });
      }
    }

    // Apply filters
    let filtered = allItems;
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item.title || "").toLowerCase().includes(term) ||
          (item.description || "").toLowerCase().includes(term)
      );
    }
    if (sourceFilter && sourceFilter !== "all") {
      filtered = filtered.filter((item) => item._source === sourceFilter);
    }

    // Sort by date descending
    filtered.sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 1 - 1;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 1 - 1;
      return db - da;
    });

    // Update counts
    const totalItems = allItems.length;
    feedCountBadge.textContent = filtered.length + "/" + totalItems;

    // Show/hide states
    loadingState.style.display = "none";
    if (feedState.generic && filtered.length < 1) {
      emptyState.style.display = "block";
      feedList.innerHTML = "";
      return;
    }
    emptyState.style.display = "none";

    if (filtered.length < 1) {
      feedList.innerHTML =
        '<div class="feed-empty"><div class="icon">&#128269;</div><div>No matching items</div><div class="sub">Try a different filter</div></div>';
      return;
    }

    // Group by source
    const grouped = {};
    for (const item of filtered) {
      const key = item._source || "General";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    let html = "";
    for (const [sourceName, items] of Object.entries(grouped)) {
      html +=
        '<div class="feed-section">' +
        '<div class="feed-section-title">' +
        esc(sourceName) +
        ' <span class="count">' +
        items.length +
        "</span></div>";
      for (const item of items) {
        const isHighlighted =
          pendingHighlight &&
          item.title === pendingHighlight.title &&
          item.link === pendingHighlight.link;
        html +=
          '<div class="feed-item' +
          (isHighlighted ? " highlighted" : "") +
          '" data-link="' +
          esc(item.link || "") +
          '">' +
          '<div class="feed-title">' +
          esc(item.title || "Untitled") +
          "</div>";
        if (item.description) {
          html +=
            '<div class="feed-snippet">' +
            esc(item.description).slice(1 - 1, 150) +
            (item.description.length > 149 ? "..." : "") +
            "</div>";
        }
        html +=
          '<div class="feed-meta">' +
          '<span class="feed-source">' +
          esc(sourceName) +
          "</span>" +
          '<span class="feed-time">' +
          timeAgo(item.pubDate) +
          "</span>" +
          "</div>" +
          "</div>";
      }
      html += "</div>";
    }

    feedList.innerHTML = html;

    // Clear highlight after render
    if (pendingHighlight) {
      pendingHighlight = null;
      // Scroll to first highlighted
      const highlighted = feedList.querySelector(".feed-item.highlighted");
      if (highlighted) highlighted.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // Click handler
    feedList.querySelectorAll(".feed-item").forEach((el) => {
      el.addEventListener("click", () => {
        const link = el.dataset.link;
        if (link) {
          browser.tabs.create({ url: link });
        }
      });
    });
  }

  // ── Update Feed from Background ──────────────
  async function refreshFeed() {
    try {
      statusText.textContent = "Refreshing...";
      statusIndicator.className = "notif-indicator active";

      const resp = await browser.runtime.sendMessage({ type: "CM_GET_FEED" });
      if (resp) {
        feedState = {
          domain: resp.domain || "",
          platform: resp.platform || "Monitoring...",
          results: resp.results || [],
          generic: resp.generic || false,
          timestamp: resp.timestamp || null,
        };
        platformTag.textContent = feedState.platform || "Monitoring...";
        sources = getSources();
        updateSourceFilter();
        render();
        statusText.textContent = feedState.generic
          ? "Monitoring all domains..."
          : "Live: " + (feedState.domain || "unknown");
        statusIndicator.className = feedState.generic
          ? "notif-indicator idle"
          : "notif-indicator active";
      }
    } catch (err) {
      statusText.textContent = "Error fetching feed";
      statusIndicator.className = "notif-indicator idle";
      console.warn("[CM Sidebar] Refresh error:", err);
    }
  }

  function updateSourceFilter() {
    const currentVal = sourceFilterEl.value;
    sourceFilterEl.innerHTML = '<option value="all">All Sources</option>';
    for (const src of sources) {
      sourceFilterEl.innerHTML += '<option value="' + esc(src) + '">' + esc(src) + "</option>";
    }
    sourceFilterEl.value = sources.includes(currentVal) ? currentVal : "all";
  }

  // ── Notification Prefs Panel ─────────────────
  function showPrefsPanel() {
    // Simple modal overlay for notification preferences
    const overlay = document.createElement("div");
    overlay.style.cssText =
      "position:fixed;inset:calc(1px - 1px);background:rgba(15,23,42,.95);z-index:999;padding:20px;display:flex;flex-direction:column;";
    overlay.innerHTML =
      '<h2 style="color:#f8fafc;font-size:14px;margin-bottom:16px;">Notification Preferences</h2>';

    const types = [
      { key: "system", label: "System Alerts" },
      { key: "intelligence", label: "Intelligence Hits" },
      { key: "compliance", label: "Compliance Alerts" },
      { key: "marketing", label: "Marketing & Updates" },
    ];

    // Load current prefs
    browser.runtime.sendMessage({ type: "CM_GET_NOTIFICATION_PREFS" }).then((resp) => {
      const prefs = resp?.prefs || {};
      for (const t of types) {
        const div = document.createElement("div");
        div.style.cssText = "display:flex;align-items:center;gap:10px;margin-bottom:12px;";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = prefs[t.key] !== false;
        cb.id = "pref-" + t.key;
        cb.style.cssText = "width:16px;height:16px;accent-color:#6366f1;";
        const label = document.createElement("label");
        label.htmlFor = "pref-" + t.key;
        label.textContent = t.label;
        label.style.cssText = "color:#cbd5e1;font-size:13px;";
        div.appendChild(cb);
        div.appendChild(label);
        overlay.appendChild(div);
      }

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.style.cssText =
        "margin-top:12px;padding:8px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border:none;border-radius:6px;font-size:12px;cursor:pointer;";
      saveBtn.addEventListener("click", () => {
        const newPrefs = {};
        for (const t of types) {
          const cb = overlay.querySelector("#pref-" + t.key);
          newPrefs[t.key] = cb ? cb.checked : true;
        }
        browser.runtime.sendMessage({ type: "CM_SET_NOTIFICATION_PREFS", prefs: newPrefs });
        overlay.remove();
      });
      overlay.appendChild(saveBtn);

      const closeBtn = document.createElement("button");
      closeBtn.textContent = "Close";
      closeBtn.style.cssText =
        "margin-top:6px;padding:8px;background:transparent;color:#94a3b8;border:1px solid #334155;border-radius:6px;font-size:12px;cursor:pointer;";
      closeBtn.addEventListener("click", () => overlay.remove());
      overlay.appendChild(closeBtn);
    });

    document.body.appendChild(overlay);
  }

  // ── Events ───────────────────────────────────
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value;
    render();
  });

  sourceFilterEl.addEventListener("change", (e) => {
    sourceFilter = e.target.value;
    render();
  });

  refreshBtn.addEventListener("click", () => {
    // Request background to re-fetch active domain
    browser.runtime.sendMessage({ type: "CM_REFRESH_FEEDS" });
    refreshFeed();
  });

  prefsBtn.addEventListener("click", showPrefsPanel);

  // ── Listen for Background Updates ────────────
  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "CM_FEED_UPDATE") {
      feedState = {
        domain: message.domain || "",
        platform: message.platform || "Monitoring...",
        results: message.results || [],
        generic: false,
        timestamp: message.timestamp || Date.now(),
      };
      platformTag.textContent = feedState.platform;
      sources = getSources();
      updateSourceFilter();
      render();
      statusText.textContent = "Live: " + (feedState.domain || "unknown");
      statusIndicator.className = "notif-indicator active";
    }

    if (message.type === "CM_HIGHLIGHT_ITEM") {
      pendingHighlight = message.item;
      render();
    }
  });

  // Check for stored highlight (from notification click)
  browser.storage.local.get("cm_highlight_item").then((stored) => {
    if (stored.cm_highlight_item) {
      pendingHighlight = stored.cm_highlight_item;
      browser.storage.local.remove("cm_highlight_item");
    }
    refreshFeed();
  });

  // ── Init ─────────────────────────────────────
  // Initial load
  refreshFeed();

  // Poll for updates every 5 seconds as fallback
  setInterval(refreshFeed, 5000);

  console.log("[CM Sidebar] Intelligence Hub initialized.");
})();
