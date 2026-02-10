// Content script running in ISOLATED world
// Has access to chrome.runtime for extension messaging
// Bridges between MAIN world (content-extractor.js) and the extension

(function () {
  'use strict';

  // ---- State ----
  let cachedSubmission = null;
  let autoSaveInProgress = false;

  // ---- Visual Notification Overlay ----
  function showOverlay(message, type = 'info') {
    // Remove any existing overlay
    const existingOverlay = document.querySelector('.notion-saver-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'notion-saver-overlay';

    const colors = {
      info: { bg: '#3b82f6', border: '#2563eb' },
      success: { bg: '#22c55e', border: '#16a34a' },
      error: { bg: '#ef4444', border: '#dc2626' }
    };

    const color = colors[type] || colors.info;

    overlay.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: white;
      border-left: 4px solid ${color.border};
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      max-width: 320px;
      animation: slideIn 0.3s ease-out;
    `;

    overlay.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 20px;">${type === 'success' ? '✅' : type === 'error' ? '❌' : '📝'}</div>
        <div style="color: #1f2937; font-weight: 500;">${message}</div>
      </div>
    `;

    // Add animation styles
    if (!document.querySelector('#notion-saver-styles')) {
      const style = document.createElement('style');
      style.id = 'notion-saver-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(400px); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(overlay);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      overlay.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => overlay.remove(), 300);
    }, 3000);
  }

  // ---- Listen for messages from MAIN world ----
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data?.type === 'SAVE_TO_NOTION_SUBMISSION') {
      cachedSubmission = event.data.payload;

      // Check for auto-save on accepted submission (statusCode 10)
      if (cachedSubmission?.statusCode === 10) {
        handleAutoSave(cachedSubmission);
      }
    }
  });

  // ---- Extract problem slug from URL ----
  function getTitleSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  // ---- Fetch problem data via LeetCode GraphQL ----
  async function fetchProblemData(titleSlug) {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
            slug
          }
          similarQuestions
        }
      }
    `;

    const response = await fetch('https://leetcode.com/graphql/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { titleSlug },
        operationName: 'questionData'
      }),
      credentials: 'include'
    });

    const data = await response.json();
    return data?.data?.question || null;
  }

  // ---- Request code from MAIN world (content-extractor.js) ----
  function requestCode() {
    return new Promise((resolve) => {
      let resolved = false;

      function onMessage(event) {
        if (event.source !== window) return;
        if (event.data?.type === 'SAVE_TO_NOTION_CODE_RESULT') {
          resolved = true;
          window.removeEventListener('message', onMessage);
          resolve(event.data.payload);
        }
      }

      window.addEventListener('message', onMessage);
      window.postMessage({ type: 'SAVE_TO_NOTION_GET_CODE' }, '*');

      // Timeout after 3 seconds
      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('message', onMessage);
          resolve({ code: '', language: '' });
        }
      }, 3000);
    });
  }

  // ---- Auto-save on accepted submission ----
  async function handleAutoSave(submission) {
    if (autoSaveInProgress) return;

    // Check if auto-save is enabled
    const storage = await chrome.storage.local.get(['autoSaveEnabled']);
    if (!storage.autoSaveEnabled) return;

    autoSaveInProgress = true;

    try {
      const slug = getTitleSlug();
      if (!slug) return;

      const [problemData, codeData] = await Promise.all([
        fetchProblemData(slug),
        requestCode()
      ]);

      if (!problemData) return;

      const url = window.location.href.split('?')[0].split('#')[0];
      // Use the code from the submission if available, otherwise from editor
      const code = submission.code || codeData.code;
      const language = submission.lang || codeData.language;

      // Check for duplicate
      const dupResponse = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'CHECK_DUPLICATE', url }, resolve);
      });

      // Analyze with Gemini
      const analysisPayload = {
        problemTitle: `${problemData.questionFrontendId}. ${problemData.title}`,
        difficulty: problemData.difficulty,
        code,
        language
      };

      const analysisResponse = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'ANALYZE_CODE', payload: analysisPayload }, resolve);
      });

      const runtime = analysisResponse?.success ? analysisResponse.data.timeComplexity : '';
      const space = analysisResponse?.success ? analysisResponse.data.spaceComplexity : '';
      const approach = analysisResponse?.success ? analysisResponse.data.approach : '';
      const tips = analysisResponse?.success ? analysisResponse.data.tips : '';

      const savePayload = {
        problem: problemData,
        code,
        language,
        submission,
        url,
        runtime,
        space,
        approach,
        tips
      };

      let result;
      if (dupResponse?.success && dupResponse.data) {
        // Append new solution to existing page
        result = await new Promise(resolve => {
          chrome.runtime.sendMessage({
            type: 'APPEND_SOLUTION',
            pageId: dupResponse.data.id,
            payload: savePayload
          }, resolve);
        });
      } else {
        // Save as new page
        result = await new Promise(resolve => {
          chrome.runtime.sendMessage({
            type: 'SAVE_TO_NOTION',
            payload: savePayload
          }, resolve);
        });
      }

      // Show notification
      const title = `${problemData.questionFrontendId}. ${problemData.title}`;
      if (result?.success) {
        chrome.runtime.sendMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Saved to Notion',
          message: dupResponse?.data
            ? `New solution appended to "${title}"`
            : `"${title}" saved successfully!`
        });
      } else {
        chrome.runtime.sendMessage({
          type: 'SHOW_NOTIFICATION',
          title: 'Auto-save Failed',
          message: result?.error || `Could not save "${title}"`
        });
      }
    } catch (error) {
      chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        title: 'Auto-save Error',
        message: error.message
      });
    } finally {
      autoSaveInProgress = false;
    }
  }

  // ---- Handle messages from popup and background ----
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Show overlay notification
    if (message.type === 'SHOW_OVERLAY') {
      showOverlay(message.message, message.overlayType || 'info');
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'EXTRACT_DATA') {
      (async () => {
        try {
          // Check if we're on a supported platform
          // For now, only LeetCode is supported (will be extended in Phase 2)
          const isLeetCode = /leetcode\.com\/problems\//.test(window.location.href);

          if (!isLeetCode) {
            sendResponse({ error: 'Not on a LeetCode problem page' });
            return;
          }

          const slug = getTitleSlug();
          if (!slug) {
            sendResponse({ error: 'Could not extract problem slug' });
            return;
          }

          const [problemData, codeData] = await Promise.all([
            fetchProblemData(slug),
            requestCode()
          ]);

          if (!problemData) {
            sendResponse({ error: 'Could not fetch problem data' });
            return;
          }

          sendResponse({
            platform: 'LeetCode', // Added for multi-platform support
            problem: problemData,
            code: codeData.code,
            language: codeData.language,
            submission: cachedSubmission,
            url: window.location.href
          });
        } catch (error) {
          sendResponse({ error: error.message });
        }
      })();
      return true; // keep channel open for async response
    }
  });
})();
