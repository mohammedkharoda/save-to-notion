// Theme Manager - Handles theme detection, persistence, and application

export class ThemeManager {
  static async initialize() {
    const { themePreference = 'system' } = await chrome.storage.local.get('themePreference');
    const theme = themePreference === 'system'
      ? this.getSystemTheme()
      : themePreference;
    this.applyTheme(theme);
    this.listenForSystemChanges();
    return theme;
  }

  static getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  static applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  static async setTheme(preference) {
    await chrome.storage.local.set({ themePreference: preference });
    const theme = preference === 'system' ? this.getSystemTheme() : preference;
    this.applyTheme(theme);
    return theme;
  }

  static async getCurrentTheme() {
    const { themePreference = 'system' } = await chrome.storage.local.get('themePreference');
    return themePreference === 'system' ? this.getSystemTheme() : themePreference;
  }

  static listenForSystemChanges() {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
      const { themePreference } = await chrome.storage.local.get('themePreference');
      if (themePreference === 'system' || !themePreference) {
        this.applyTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
}
