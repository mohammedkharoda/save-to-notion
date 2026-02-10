# 🤝 Contributing to Save to Notion - LeetCode

First off, thanks for taking the time to contribute! 🎉

The following is a set of guidelines for contributing to this Chrome extension. These are mostly guidelines, not rules. Use your best judgment, and feel free to propose changes to this document in a pull request.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Guidelines](#coding-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by a simple principle: **Be respectful and constructive**.

- Use welcoming and inclusive language
- Be respectful of differing viewpoints and experiences
- Gracefully accept constructive criticism
- Focus on what is best for the community
- Show empathy towards other community members

---

## 🚀 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

**Bug Report Template:**
```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Chrome Version: [e.g. 120.0.6099.109]
- Extension Version: [e.g. 2.0.0]
- OS: [e.g. Windows 11, macOS 14]

**Additional context**
Any other context about the problem.
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear and descriptive title
- Provide a detailed description of the suggested enhancement
- Explain why this enhancement would be useful
- List some examples of how it would be used

### 🔧 Contributing Code

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
6. **Push to the branch** (`git push origin feature/AmazingFeature`)
7. **Open a Pull Request**

---

## 💻 Development Setup

### Prerequisites

- Google Chrome (latest version)
- Text editor (VS Code recommended)
- Git

### Setting Up Development Environment

```bash
# 1. Fork and clone the repository
git clone https://github.com/yourusername/save-to-notion-leetcode.git
cd save-to-notion-leetcode

# 2. Load extension in Chrome
# - Open Chrome and go to chrome://extensions/
# - Enable "Developer mode" (top-right toggle)
# - Click "Load unpacked"
# - Select the cloned folder

# 3. Make changes and test
# After making changes, click the reload icon on chrome://extensions/
```

### Testing Your Changes

1. **Test on LeetCode:** Go to any problem and test the extension
2. **Test all features:**
   - Save functionality
   - Dark mode toggle
   - Keyboard shortcuts
   - Auto-save (if applicable)
   - Options page
3. **Check console:** Look for errors in:
   - Extension popup (right-click → Inspect)
   - Background service worker (chrome://extensions/ → Inspect views)
   - LeetCode page console (F12)

---

## 📁 Project Structure

```
save-to-notion/
├── manifest.json           # Extension manifest (Manifest V3)
├── background.js          # Service worker (background tasks)
├── content.js             # Content script (ISOLATED world)
├── content-extractor.js   # Content script (MAIN world)
├── notion-api.js          # Notion API integration
├── popup.html/js/css      # Extension popup UI
├── options.html/js/css    # Settings page
├── theme.css              # Theme system (dark/light)
├── platforms/             # Platform adapters (LeetCode, etc.)
│   ├── platform-interface.js
│   ├── platform-registry.js
│   └── leetcode-adapter.js
├── utils/                 # Utility functions
│   └── theme-manager.js
└── icons/                 # Extension icons
```

### Key Files Explained

- **`manifest.json`** - Extension configuration and permissions
- **`background.js`** - Handles keyboard shortcuts, auto-save, API calls
- **`content.js`** - Bridges between page and extension
- **`content-extractor.js`** - Extracts data from LeetCode DOM
- **`notion-api.js`** - All Notion API interactions
- **`platforms/`** - Architecture for multi-platform support

---

## 📝 Coding Guidelines

### JavaScript Style

- Use modern ES6+ syntax
- Use `const` by default, `let` when needed, avoid `var`
- Use template literals for string interpolation
- Add comments for complex logic
- Keep functions small and focused

**Example:**
```javascript
// Good ✅
async function saveProblemToNotion(data) {
  const { accessToken, databaseId } = await getSettings();

  try {
    const result = await createNotionPage(accessToken, databaseId, data);
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to save:', error);
    return { success: false, error: error.message };
  }
}

// Bad ❌
function save(d) {
  var t = getToken()
  var db = getDb()
  // ... complex logic without error handling
}
```

### CSS Style

- Use CSS variables for theming
- Follow BEM naming convention for clarity
- Keep selectors specific but not overly nested
- Support both light and dark themes

**Example:**
```css
/* Good ✅ */
.btn-primary {
  background: var(--accent-blue);
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
}

[data-theme="dark"] .btn-primary {
  background: var(--accent-blue-dark);
}

/* Bad ❌ */
button {
  background: #2563eb; /* hardcoded color */
}
```

### HTML Structure

- Use semantic HTML
- Keep markup clean and readable
- Add ARIA labels for accessibility

---

## 💬 Commit Messages

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(dark-mode): add system theme sync
fix(notion-api): handle missing optional properties
docs(readme): add installation instructions
refactor(content): extract platform detection logic
```

---

## 🔀 Pull Request Process

### Before Submitting

1. ✅ Test your changes thoroughly
2. ✅ Update documentation if needed
3. ✅ Follow coding guidelines
4. ✅ Check for console errors
5. ✅ Test on both light and dark themes

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on LeetCode
- [ ] Tested dark mode
- [ ] Tested keyboard shortcuts
- [ ] No console errors

## Screenshots
(if applicable)

## Additional Notes
Any additional information
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged
4. Your contribution will be credited in releases! 🎉

---

## 🏗️ Feature Roadmap

Want to contribute but not sure where to start? Check out these planned features:

### High Priority
- [ ] Submission history tracking
- [ ] Multi-platform support (HackerRank, Codeforces)
- [ ] Progress dashboard

### Medium Priority
- [ ] Export to markdown
- [ ] Batch operations
- [ ] Custom templates

### Future Ideas
- [ ] Browser sync
- [ ] Team sharing features
- [ ] Integration with other tools

---

## 🎓 Learning Resources

New to Chrome extensions? Check these out:

- [Chrome Extension Documentation](https://developer.chrome.com/docs/extensions/)
- [Notion API Documentation](https://developers.notion.com/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)

---

## 📞 Getting Help

- **Questions?** Open a [GitHub Discussion](https://github.com/yourusername/save-to-notion-leetcode/discussions)
- **Bugs?** Open an [Issue](https://github.com/yourusername/save-to-notion-leetcode/issues)
- **Want to chat?** Join our community (Discord link coming soon!)

---

## 🙏 Thank You!

Every contribution, no matter how small, makes a difference. Thank you for helping make this extension better! 💙

**Happy Coding!** 🚀
