// ──────────────────────────────────────────────
// Notification Preferences Module (Sprint 7)
// Manages user notification toggles stored in browser.storage.sync
// ──────────────────────────────────────────────

const PREFS_KEY = 'cm_notification_prefs';

const DEFAULTS = {
  system: true,        // System alerts (errors, deadlines)
  intelligence: true,  // RSS/API intelligence hits
  compliance: true,    // Governance compliance alerts
  marketing: false,    // Optional marketing/updates
};

// Load notification preferences
async function loadPrefs() {
  try {
    const result = await browser.storage.sync.get(PREFS_KEY);
    return { ...DEFAULTS, ...(result[PREFS_KEY] || {}) };
  } catch (err) {
    console.warn('Failed to load notification prefs:', err);
    return { ...DEFAULTS };
  }
}

// Save notification preferences
async function savePrefs(prefs) {
  try {
    await browser.storage.sync.set({ [PREFS_KEY]: prefs });
    return true;
  } catch (err) {
    console.warn('Failed to save notification prefs:', err);
    return false;
  }
}

// Check if a given notification type is enabled
async function isTypeEnabled(type) {
  const prefs = await loadPrefs();
  return prefs[type] === true;
}

// Get the full defaults (for reset)
function getDefaults() {
  return { ...DEFAULTS };
}

