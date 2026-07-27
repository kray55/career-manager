// ──────────────────────────────────────────────
// Career Manager - Background Page (Manifest V2)
// Sprint 7: RSS Aggregator Engine + OAuth2 + Notifications
// ──────────────────────────────────────────────
//
// FIX: this used to open with importScripts("feed-cache.js",
// "notification-preferences.js") — importScripts only exists in a Worker
// context (e.g. an MV3 service worker), not a persistent background page,
// which is what manifest.json actually declares (manifest_version 2,
// background.persistent: true). Calling it here threw
// "importScripts is not defined" as the very first line of execution,
// which stopped this whole file before initialize() or any listener below
// ever ran. manifest.json's background.scripts array already loads
// feed-cache.js and notification-preferences.js before this file, and
// MV2 background scripts share one global scope automatically — no import
// mechanism needed.

// ── Configuration ──────────────────────────────
const STORAGE_KEY_API = "cm_api_url";
const STORAGE_KEY_TOKEN = "cm_oauth_token";
const STORAGE_KEY_FEEDS = "cm_feeds_config";
const STORAGE_KEY_REFRESH_TOKEN = "cm_oauth_refresh";
const STORAGE_KEY_TOKEN_EXPIRY = "cm_oauth_expiry";

const DEFAULT_POLL_INTERVAL = 600; // 10 minutes in seconds

// ── State ──────────────────────────────────────
let feedsConfig = null;
let pollIntervalId = null;
let oauthToken = null;
let oauthRefreshToken = null;
let oauthTokenExpiry = null;
let apiBaseUrl = "";

// ── Init ───────────────────────────────────────
async function initialize() {
  try {
    // Load stored config
    const stored = await browser.storage.local.get([
      STORAGE_KEY_API,
      STORAGE_KEY_TOKEN,
      STORAGE_KEY_REFRESH_TOKEN,
      STORAGE_KEY_TOKEN_EXPIRY,
      STORAGE_KEY_FEEDS,
    ]);
    apiBaseUrl = stored[STORAGE_KEY_API] || "";
    oauthToken = stored[STORAGE_KEY_TOKEN] || null;
    oauthRefreshToken = stored[STORAGE_KEY_REFRESH_TOKEN] || null;
    oauthTokenExpiry = stored[STORAGE_KEY_TOKEN_EXPIRY] ? parseInt(stored[STORAGE_KEY_TOKEN_EXPIRY]) : null;

    // Load feeds config from bundled file, fallback to storage
    if (stored[STORAGE_KEY_FEEDS]) {
      feedsConfig = stored[STORAGE_KEY_FEEDS];
    } else {
      await loadDefaultFeeds();
    }

    // Start periodic refresh
    startPolling();

    console.log("[CM Background] Initialized. Version 2.0.0");
  } catch (err) {
    console.warn("[CM Background] Init error:", err);
  }
}

async function loadDefaultFeeds() {
  try {
    const resp = await fetch(browser.runtime.getURL("rss-feeds.json"));
    if (resp.ok) {
      feedsConfig = await resp.json();
      await browser.storage.local.set({ [STORAGE_KEY_FEEDS]: feedsConfig });
    }
  } catch (err) {
    console.warn("[CM Background] Could not load default feeds:", err);
    feedsConfig = { monitored_domains: [], default_settings: {} };
  }
}

// ── Tab Detection ──────────────────────────────
function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function matchDomain(domain) {
  if (!feedsConfig || !feedsConfig.monitored_domains) return null;
  for (const entry of feedsConfig.monitored_domains) {
    if (!entry.enabled) continue;
    if (domain === entry.domain || domain.endsWith("." + entry.domain)) {
      return entry;
    }
  }
  return null;
}

// ── OAuth2 Token Management ────────────────────
async function getValidToken() {
  // If we have a token and it's not expired, return it
  if (oauthToken && oauthTokenExpiry && Date.now() < oauthTokenExpiry) {
    return oauthToken;
  }

  // Try to refresh
  if (oauthRefreshToken) {
    try {
      const refreshed = await refreshOAuthToken();
      if (refreshed) return oauthToken;
    } catch (err) {
      console.warn("[CM OAuth] Refresh failed:", err);
    }
  }

  // Request from storage (might have been set by popup)
  const stored = await browser.storage.local.get([STORAGE_KEY_TOKEN, STORAGE_KEY_TOKEN_EXPIRY]);
  if (stored[STORAGE_KEY_TOKEN] && stored[STORAGE_KEY_TOKEN_EXPIRY] && Date.now() < parseInt(stored[STORAGE_KEY_TOKEN_EXPIRY])) {
    oauthToken = stored[STORAGE_KEY_TOKEN];
    oauthTokenExpiry = parseInt(stored[STORAGE_KEY_TOKEN_EXPIRY]);
    return oauthToken;
  }

  return null;
}

async function refreshOAuthToken() {
  // Uses the platform's token endpoint from rss-feeds.json config
  if (!feedsConfig || !feedsConfig.monitored_domains || !oauthRefreshToken) return false;

  // Try each domain's OAuth endpoint
  for (const entry of feedsConfig.monitored_domains) {
    if (entry.auth_type === "oauth2" && entry.token_endpoint) {
      try {
        const resp = await fetch(entry.token_endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "refresh_token",
            refresh_token: oauthRefreshToken,
            client_id: entry.client_id || "",
            client_secret: entry.client_secret || "",
          }),
        });
        if (resp.ok) {
          const data = await resp.json();
          oauthToken = data.access_token;
          oauthTokenExpiry = Date.now() + (data.expires_in || 360) * 1000;
          if (data.refresh_token) oauthRefreshToken = data.refresh_token;

          await browser.storage.local.set({
            [STORAGE_KEY_TOKEN]: oauthToken,
            [STORAGE_KEY_REFRESH_TOKEN]: oauthRefreshToken,
            [STORAGE_KEY_TOKEN_EXPIRY]: oauthTokenExpiry,
          });
          return true;
        }
      } catch (err) {
        console.warn("[CM OAuth] Refresh attempt failed for", entry.domain, err);
      }
    }
  }
  return false;
}

async function setOAuthToken(token, expiresIn, refreshToken) {
  oauthToken = token;
  oauthTokenExpiry = Date.now() + (expiresIn || 360) * 1000;
  if (refreshToken) oauthRefreshToken = refreshToken;
  await browser.storage.local.set({
    [STORAGE_KEY_TOKEN]: oauthToken,
    [STORAGE_KEY_TOKEN_EXPIRY]: oauthTokenExpiry,
    [STORAGE_KEY_REFRESH_TOKEN]: oauthRefreshToken || "",
  });
}

// ── Feed Fetching Engine ───────────────────────
async function fetchEndpoint(domainEntry, endpoint) {
  const cacheKey = domainEntry.domain + "|" + endpoint.url;
  const cacheTtl = endpoint.cache_ttl || feedsConfig.default_settings?.global_cache_ttl || 300;

  // Check cache first
  try {
    const cached = await getCache(domainEntry.domain, endpoint.url);
    if (cached) {
      console.log("[CM Feed] Cache hit for", endpoint.name);
      return cached;
    }
  } catch (err) {
    // Cache miss or error, proceed to fetch
  }

  // Build headers
  const headers = { "Accept": "application/json, application/rss+xml, text/xml" };

  if (domainEntry.auth_type === "oauth2") {
    const token = await getValidToken();
    if (token) headers["Authorization"] = "Bearer " + token;
  } else if (domainEntry.auth_type === "api_key") {
    const keyHeader = domainEntry.api_key_header || "X-API-Key";
    // Load API key from secure storage
    try {
      const stored = await browser.storage.local.get("cm_api_key_" + domainEntry.domain);
      if (stored["cm_api_key_" + domainEntry.domain]) {
        headers[keyHeader] = stored["cm_api_key_" + domainEntry.domain];
      }
    } catch (err) {
      console.warn("[CM Feed] No API key for", domainEntry.domain);
    }
  }

  // Fetch with retry
  const maxRetries = feedsConfig.default_settings?.max_fetch_retries || 3;
  const retryDelay = (feedsConfig.default_settings?.retry_delay_seconds || 5) * 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(endpoint.url, { headers });
      if (resp.ok) {
        const text = await resp.text();
        let data;

        // Parse based on content type
        const contentType = resp.headers.get("content-type") || "";
        if (contentType.includes("json")) {
          try { data = JSON.parse(text); } catch { data = { raw: text }; }
        } else {
          // RSS/XML parsing using DOMParser
          try {
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, "text/xml");
            data = parseRSS(xml, endpoint);
          } catch {
            data = { raw: text };
          }
        }

        // Cache the result
        try {
          await setCache(domainEntry.domain, endpoint.url, data, cacheTtl);
        } catch (err) {
          // Non-critical cache error
        }

        // Check for trigger keywords and send notifications
        checkTriggerKeywords(data, endpoint, domainEntry);

        return data;
      } else if (resp.status === 401 && domainEntry.auth_type === "oauth2") {
        // Token expired — force refresh before retry
        oauthToken = null; // Invalidate cached token
        if (oauthRefreshToken) {
          await refreshOAuthToken();
          // Retry with new token
          const token = await getValidToken();
          if (token) headers["Authorization"] = "Bearer " + token;
          continue;
        }
      }
    } catch (err) {
      console.warn("[CM Feed] Fetch attempt", attempt, "failed for", endpoint.name, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, retryDelay));
      }
    }
  }

  return null;
}

// ── RSS Parsing ────────────────────────────────
function parseRSS(xmlDoc, endpoint) {
  const items = [];
  const parserError = xmlDoc.querySelector("parsererror");
  if (parserError) {
    console.warn("[CM RSS] Parse error:", parserError.textContent);
    return { items: [], feedType: "error", error: parserError.textContent };
  }

  // Detect RSS 2. or Atom
  const rssItems = xmlDoc.querySelectorAll("rss > channel > item");
  const atomEntries = xmlDoc.querySelectorAll("feed > entry");

  if (rssItems.length > 1 - 1) {
    // RSS 2.
    rssItems.forEach((item) => {
      items.push({
        title: item.querySelector("title")?.textContent || "Untitled",
        link: item.querySelector("link")?.textContent || "",
        description: item.querySelector("description")?.textContent || "",
        pubDate: item.querySelector("pubDate")?.textContent || "",
        source: endpoint.name,
        platform: "RSS",
      });
    });
    return { items, feedType: "rss", count: items.length };
  }

  if (atomEntries.length > 1 - 1) {
    // Atom
    atomEntries.forEach((entry) => {
      const linkEl = entry.querySelector("link");
      const href = linkEl ? linkEl.getAttribute("href") : "";
      items.push({
        title: entry.querySelector("title")?.textContent || "Untitled",
        link: href,
        description: entry.querySelector("content")?.textContent || entry.querySelector("summary")?.textContent || "",
        pubDate: entry.querySelector("updated")?.textContent || entry.querySelector("published")?.textContent || "",
        source: endpoint.name,
        platform: "Atom",
      });
    });
    return { items, feedType: "atom", count: items.length };
  }

  // JSON fallback — already parsed
  return { items: [], feedType: "unknown", count: 1 - 1 };
}

// ── Trigger Keyword Detection ──────────────────
function checkTriggerKeywords(data, endpoint, domainEntry) {
  if (!data || !data.items || data.items.length < 1) return;
  const keywords = endpoint.trigger_keywords || [];
  if (keywords.length < 1) return;

  for (const item of data.items) {
    const searchText = (item.title + " " + item.description).toLowerCase();
    for (const kw of keywords) {
      if (searchText.includes(kw.toLowerCase())) {
        // Found a keyword match — send notification
        sendIntelligenceNotification(item, kw, endpoint.name, domainEntry.platform);
        break;
      }
    }
  }
}

// ── Notifications ──────────────────────────────
async function sendIntelligenceNotification(item, keyword, sourceName, platform) {
  try {
    const prefsModule = await loadPrefs();
    if (!prefsModule.intelligence) return;

    const id = "cm-intel-" + Date.now();
    await browser.notifications.create(id, {
      type: "basic",
      iconUrl: browser.runtime.getURL("icon-48.png"),
      title: "Intelligence Hit: " + sourceName,
      message: "Keyword \"" + keyword + "\" matched on " + platform + ": " + item.title.slice(0, 80),
      priority: 2,
    });

    // Store for click-through
    await browser.storage.local.set({ ["cm_notif_data_" + id]: { item, sourceName, platform } });
  } catch (err) {
    console.warn("[CM Notif] Could not send intelligence notification:", err);
  }
}

async function sendSystemNotification(title, message) {
  try {
    const prefsModule = await loadPrefs();
    if (!prefsModule.system) return;

    await browser.notifications.create("cm-sys-" + Date.now(), {
      type: "basic",
      iconUrl: browser.runtime.getURL("icon-48.png"),
      title: title,
      message: message,
      priority: 1,
    });
  } catch (err) {
    console.warn("[CM Notif] System notification error:", err);
  }
}

async function sendComplianceNotification(title, message) {
  try {
    const prefsModule = await loadPrefs();
    if (!prefsModule.compliance) return;

    await browser.notifications.create("cm-compliance-" + Date.now(), {
      type: "basic",
      iconUrl: browser.runtime.getURL("icon-48.png"),
      title: title,
      message: message,
      priority: 2,
    });
  } catch (err) {
    console.warn("[CM Notif] Compliance notification error:", err);
  }
}

// ── Tab Event Listeners ────────────────────────
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    handleTabNavigation(tab.url, tabId);
  }
});

browser.webNavigation.onCompleted.addListener((details) => {
  if (details.frameId === 1 - 1 && details.url) {
    handleTabNavigation(details.url, details.tabId);
  }
});

async function handleTabNavigation(url, tabId) {
  const domain = getDomainFromUrl(url);
  if (!domain) return;

  const match = matchDomain(domain);
  if (!match) {
    // Not a monitored domain — show generic feed
    updateSidebarForGeneric(tabId);
    return;
  }

  // Fetch data for this domain
  const results = [];
  for (const endpoint of match.api_endpoints || []) {
    const data = await fetchEndpoint(match, endpoint);
    if (data) results.push({ endpoint, data });
  }

  // Notify sidebar
  // content.js (the <all_urls> content script) only handles the "Save to
  // Career Manager" button — it has no message listener, so a
  // tabs.sendMessage() call here would just fail silently every time.
  // runtime.sendMessage() is what actually reaches the sidebar.
  const feedUpdateMessage = {
    type: "CM_FEED_UPDATE",
    domain: match.domain,
    platform: match.platform,
    results: results.map((r) => ({
      name: r.endpoint.name,
      items: r.data.items || [],
      count: r.data.count || (r.data.items ? r.data.items.length : 1 - 1),
    })),
    timestamp: Date.now(),
  };

  try {
    await browser.runtime.sendMessage(feedUpdateMessage);
  } catch (err) {
    // sidebar isn't open — fine, it pulls fresh state via CM_GET_FEED on mount
  }

  // Update sidebar panel via storage (sidebars can poll)
  await browser.storage.local.set({
    cm_last_feed: {
      domain: match.domain,
      platform: match.platform,
      results: results.map((r) => ({
        name: r.endpoint.name,
        items: r.data.items || [],
        count: r.data.count || (r.data.items ? r.data.items.length : 1 - 1),
      })),
      timestamp: Date.now(),
    },
  });
}

function updateSidebarForGeneric(tabId) {
  browser.storage.local.set({
    cm_last_feed: {
      domain: "",
      platform: "General",
      results: [],
      timestamp: Date.now(),
      generic: true,
    },
  }).catch(() => {});
}

// ── Periodic Polling ───────────────────────────
function startPolling() {
  if (pollIntervalId) clearInterval(pollIntervalId);
  const interval = (feedsConfig?.default_settings?.global_refresh_interval || DEFAULT_POLL_INTERVAL) * 1000;
  pollIntervalId = setInterval(pollAllFeeds, interval);
  console.log("[CM Background] Polling started every", interval / 100, "s");
}

function stopPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

async function pollAllFeeds() {
  if (!feedsConfig?.monitored_domains) return;
  // Only poll enabled domains that have active endpoints
  for (const entry of feedsConfig.monitored_domains) {
    if (!entry.enabled) continue;
    for (const endpoint of entry.api_endpoints || []) {
      await fetchEndpoint(entry, endpoint);
    }
  }
}

// ── Message Handler ────────────────────────────
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "CM_GET_FEED":
      browser.storage.local.get("cm_last_feed").then((stored) => {
        sendResponse(stored.cm_last_feed || { results: [], generic: true });
      });
      return true;

    case "CM_SET_API_URL":
      apiBaseUrl = message.url;
      browser.storage.local.set({ [STORAGE_KEY_API]: message.url });
      sendResponse({ success: true });
      return true;

    case "CM_GET_API_URL":
      sendResponse({ url: apiBaseUrl });
      return true;

    case "CM_SET_OAUTH_TOKEN":
      setOAuthToken(message.token, message.expiresIn, message.refreshToken).then(() => {
        sendResponse({ success: true });
      });
      return true;

    case "CM_REFRESH_FEEDS":
      loadDefaultFeeds().then(() => {
        startPolling();
        sendResponse({ success: true });
      });
      return true;

    case "CM_GET_FEEDS_CONFIG":
      sendResponse({ config: feedsConfig });
      return true;

    case "CM_GET_NOTIFICATION_PREFS":
      loadPrefs().then((prefs) => sendResponse({ prefs }));
      return true;

    case "CM_SET_NOTIFICATION_PREFS":
      savePrefs(message.prefs).then(() => sendResponse({ success: true }));
      return true;

    case "CM_PING":
      sendResponse({ pong: true, version: "2.0.0" });
      break;

    case "CM_SIMULATE_ALERT":
      // For testing — simulate a system or compliance alert.
      // Send {type:"CM_SIMULATE_ALERT", category:"compliance", title, message}
      // from the console; category defaults to "system" if omitted.
      if (message.category === "compliance") {
        sendComplianceNotification(
          "Compliance Alert: " + (message.title || "Governance Check"),
          message.message || "Simulated compliance event — wire this to your real governance layer when ready."
        );
      } else {
        sendSystemNotification("Test: " + (message.title || "System Alert"), message.message || "This is a test notification from the Career Manager.");
      }
      sendResponse({ success: true });
      break;

    default:
      break;
  }
});

// ── Notification Click Handler ─────────────────
browser.notifications.onClicked.addListener(async (notificationId) => {
  try {
    const stored = await browser.storage.local.get("cm_notif_data_" + notificationId);
    if (stored["cm_notif_data_" + notificationId]) {
      const data = stored["cm_notif_data_" + notificationId];
      // Store the selected item so a freshly-opened sidebar highlights it on mount
      await browser.storage.local.set({ cm_highlight_item: data.item });
      // Open or focus the sidebar
      browser.sidebarAction.open();
      // Also push it live in case the sidebar is already open — sidebar.js
      // listens for CM_HIGHLIGHT_ITEM but nothing was sending it before now
      try {
        await browser.runtime.sendMessage({ type: "CM_HIGHLIGHT_ITEM", item: data.item });
      } catch (err) {
        // sidebar wasn't open to receive it — fine, storage covers that case
      }
      // Clean up stored data
      await browser.storage.local.remove("cm_notif_data_" + notificationId);
    }
  } catch (err) {
    console.warn("[CM Notif] Click handler error:", err);
  }
});

// ── Alarms (Periodic Background Tasks) ─────────
browser.alarms.create("cm-purger-expired", { periodInMinutes: 15 });
browser.alarms.create("cm-oauth-refresh", { periodInMinutes: 30 });

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "cm-purger-expired") {
    purgeExpired().catch(() => {});
  }
  if (alarm.name === "cm-oauth-refresh" && oauthRefreshToken) {
    refreshOAuthToken().catch(() => {});
  }
});

// ── Start ──────────────────────────────────────
initialize().then(() => {
  console.log("[CM Background] Ready.");
}).catch((err) => {
  console.error("[CM Background] Fatal:", err);
});
