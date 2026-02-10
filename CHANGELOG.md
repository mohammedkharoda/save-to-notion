# 📝 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2024-01-XX

### 🎉 Major Release - Feature-Packed Update

### ✨ Added
- **Dark Mode Support** 🌓
  - System theme synchronization
  - Manual light/dark/system toggle
  - Beautiful dark theme for popup and options
  - Smooth theme transitions

- **Keyboard Shortcuts** ⌨️
  - `Ctrl+Shift+S` - Quick save to Notion
  - `Ctrl+Shift+E` - Extract problem data
  - Customizable shortcuts via `chrome://extensions/shortcuts`
  - Visual overlay notifications for feedback

- **Enhanced Content Formatting** 📝
  - Structured Notion blocks for problem descriptions
  - Proper paragraph separation
  - Preserved code blocks
  - Bulleted lists maintain structure
  - Better spacing and readability

- **Multi-Platform Architecture** 🏗️
  - Platform adapter pattern implemented
  - LeetCode adapter fully functional
  - Foundation ready for HackerRank, Codeforces, CodeChef, AtCoder
  - Platform badge in popup UI

### 🐛 Fixed
- **Optional Properties Handling**
  - Extension now gracefully handles missing Notion properties
  - Automatic retry with only required properties
  - No more "is not a property that exists" errors
  - Runtime and Space properties are truly optional

- **DOMParser Error**
  - Replaced DOM-based HTML parsing with regex-based approach
  - Works perfectly in Chrome extension service worker context
  - No more parsing errors in background script

- **Content Formatting Issues**
  - Fixed problem descriptions appearing as single paragraph
  - Proper HTML to Notion block conversion
  - Better markdown and spacing preservation

### 🔧 Changed
- Updated to Manifest V3 best practices
- Improved error handling throughout
- Enhanced UI/UX with better feedback
- Optimized content script performance
- Updated documentation and help text

### 📚 Documentation
- Comprehensive README with emojis and sections
- CONTRIBUTING.md for developers
- Detailed database schema documentation
- Troubleshooting guide added
- MIT License added

---

## [1.0.0] - Initial Release

### ✨ Added
- **Core Save Functionality**
  - Save LeetCode solutions to Notion
  - Extract problem details (title, difficulty, tags)
  - Capture code and language
  - Store submission statistics

- **Notion Integration**
  - Connect via Notion API token
  - Select database from dropdown
  - Create formatted pages with problem data
  - Support for all required properties

- **Duplicate Detection**
  - Check if problem already exists
  - Option to append new solution
  - Prevent accidental duplicates

- **Auto-Save Feature**
  - Automatically save on "Accepted" submission
  - Toggle on/off in settings
  - Non-intrusive notifications

- **AI Analysis (Gemini Integration)**
  - Time complexity detection
  - Space complexity detection
  - Approach identification
  - Optimization tips generation

- **Extension UI**
  - Clean popup interface
  - Settings/options page
  - Database connection management
  - API key configuration

- **Problem Data Capture**
  - Full problem description
  - Topic tags from LeetCode
  - Submission runtime and memory stats
  - Solution code with syntax highlighting

### 🎨 UI/UX
- Modern, clean interface
- Responsive design
- Clear status messages
- Loading states
- Error handling feedback

---

## Upcoming Features 🚀

### [2.1.0] - Next Release
- [ ] Submission history tracking
- [ ] Multiple attempts per problem with timestamps
- [ ] Enhanced duplicate detection with version management

### [3.0.0] - Future
- [ ] Multi-platform support (HackerRank, Codeforces, etc.)
- [ ] Progress dashboard and analytics
- [ ] Export to markdown
- [ ] Batch operations
- [ ] Custom templates

---

## Version History

- **2.0.0** - Major feature update (Dark mode, Shortcuts, Enhanced formatting)
- **1.0.0** - Initial release (Core save functionality)

---

## Migration Guides

### Migrating from 1.x to 2.0

**No breaking changes!** All your existing data and settings are preserved.

**New optional database properties:**
- `Runtime` (Text) - For time complexity
- `Space` (Text) - For space complexity
- `Platform` (Select) - For multi-platform support

These are **optional** and will be automatically skipped if they don't exist.

**New features to try:**
1. Enable dark mode in options
2. Try keyboard shortcuts (`Ctrl+Shift+S`)
3. Enjoy better formatted problem descriptions!

---

## Support

Found a bug? Want a feature? [Open an issue](https://github.com/yourusername/save-to-notion-leetcode/issues)!

---

**Full Changelog:** https://github.com/yourusername/save-to-notion-leetcode/blob/main/CHANGELOG.md
