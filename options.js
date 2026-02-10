// ---- Theme Manager ----
import { ThemeManager } from './utils/theme-manager.js';

const apiKeyInput = document.getElementById('api-key');
const geminiApiKeyInput = document.getElementById('gemini-api-key');
const dbSelect = document.getElementById('db-select');
const loadDbBtn = document.getElementById('load-db-btn');
const saveBtn = document.getElementById('save-btn');
const statusEl = document.getElementById('status');
const autoSaveToggle = document.getElementById('auto-save-toggle');
const themeSystemRadio = document.getElementById('theme-system');
const themeLightRadio = document.getElementById('theme-light');
const themeDarkRadio = document.getElementById('theme-dark');

function showStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = type;
}

function hideStatus() {
  statusEl.className = 'hidden';
}

// Enable/disable load button based on API key input
apiKeyInput.addEventListener('input', () => {
  const hasKey = apiKeyInput.value.trim().length > 0;
  loadDbBtn.disabled = !hasKey;
});

// Load databases from Notion
loadDbBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) return;

  loadDbBtn.disabled = true;
  dbSelect.disabled = true;
  dbSelect.innerHTML = '<option value="">Loading...</option>';
  showStatus('Testing connection and loading databases...', 'loading');

  chrome.runtime.sendMessage(
    { type: 'TEST_CONNECTION', apiKey },
    (response) => {
      loadDbBtn.disabled = false;
      dbSelect.disabled = false;

      if (response?.success && response.data?.length > 0) {
        hideStatus();
        dbSelect.innerHTML = '<option value="">Select a database...</option>';
        response.data.forEach(db => {
          const opt = document.createElement('option');
          opt.value = db.id;
          opt.textContent = db.title;
          dbSelect.appendChild(opt);
        });

        // Restore previously selected
        chrome.storage.local.get(['selectedDatabaseId'], (data) => {
          if (data.selectedDatabaseId) {
            dbSelect.value = data.selectedDatabaseId;
          }
        });
      } else if (response?.success && response.data?.length === 0) {
        dbSelect.innerHTML = '<option value="">No databases found</option>';
        showStatus('No databases found. Make sure you shared a database with your integration.', 'error');
      } else {
        dbSelect.innerHTML = '<option value="">Connection failed</option>';
        showStatus(response?.error || 'Failed to connect. Check your API key.', 'error');
      }
    }
  );
});

// Save settings
saveBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  const databaseId = dbSelect.value;
  const databaseName = dbSelect.options[dbSelect.selectedIndex]?.textContent || '';

  if (!apiKey) {
    showStatus('Please enter your Notion API key.', 'error');
    return;
  }

  if (!databaseId) {
    showStatus('Please select a database.', 'error');
    return;
  }

  const geminiKey = geminiApiKeyInput.value.trim();

  // Get selected theme
  let themePreference = 'system';
  if (themeLightRadio.checked) themePreference = 'light';
  else if (themeDarkRadio.checked) themePreference = 'dark';

  chrome.storage.local.set({
    notionApiKey: apiKey,
    selectedDatabaseId: databaseId,
    selectedDatabaseName: databaseName,
    geminiApiKey: geminiKey,
    autoSaveEnabled: autoSaveToggle.checked,
    themePreference: themePreference
  }, async () => {
    // Apply theme immediately
    await ThemeManager.setTheme(themePreference);
    showStatus('Settings saved!', 'success');
  });
});

// Theme change handlers
[themeSystemRadio, themeLightRadio, themeDarkRadio].forEach(radio => {
  radio.addEventListener('change', async () => {
    if (radio.checked) {
      await ThemeManager.setTheme(radio.value);
    }
  });
});

// Keyboard shortcuts customization
const openShortcutsBtn = document.getElementById('open-shortcuts-settings');
if (openShortcutsBtn) {
  openShortcutsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
}

// Initialize theme on page load
ThemeManager.initialize();

// Load existing settings on page open
chrome.storage.local.get(
  ['notionApiKey', 'selectedDatabaseId', 'selectedDatabaseName', 'geminiApiKey', 'autoSaveEnabled', 'themePreference'],
  (data) => {
    if (data.notionApiKey) {
      apiKeyInput.value = data.notionApiKey;
      loadDbBtn.disabled = false;

      if (data.selectedDatabaseId) {
        dbSelect.innerHTML = `<option value="${data.selectedDatabaseId}">${data.selectedDatabaseName || 'Previously selected'}</option>`;
        dbSelect.value = data.selectedDatabaseId;
        dbSelect.disabled = false;
      }
    }
    if (data.geminiApiKey) {
      geminiApiKeyInput.value = data.geminiApiKey;
    }
    if (data.autoSaveEnabled) {
      autoSaveToggle.checked = true;
    }
    // Load theme preference
    const theme = data.themePreference || 'system';
    if (theme === 'system') themeSystemRadio.checked = true;
    else if (theme === 'light') themeLightRadio.checked = true;
    else if (theme === 'dark') themeDarkRadio.checked = true;
  }
);
