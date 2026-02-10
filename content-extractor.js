// Content script running in MAIN world (page JS context)
// Has access to window.monaco and can intercept fetch
// Communicates with content.js via window.postMessage

(function () {
  'use strict';

  // ---- Fetch Interception ----
  // Wrap fetch before LeetCode scripts load to capture submission results
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);

    try {
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
      if (url && url.includes('/graphql')) {
        const body = typeof args[1]?.body === 'string'
          ? JSON.parse(args[1].body)
          : null;

        // Detect submission details response
        const isSubmission =
          body?.operationName === 'submissionDetails' ||
          body?.query?.includes('submissionDetails');

        if (isSubmission) {
          const clone = response.clone();
          const data = await clone.json();

          if (data?.data?.submissionDetails) {
            const d = data.data.submissionDetails;
            window.postMessage({
              type: 'SAVE_TO_NOTION_SUBMISSION',
              payload: {
                runtime: d.runtime,
                runtimeDisplay: d.runtimeDisplay,
                runtimePercentile: d.runtimePercentile,
                memory: d.memory,
                memoryDisplay: d.memoryDisplay,
                memoryPercentile: d.memoryPercentile,
                statusCode: d.statusCode,
                lang: d.lang?.name || d.lang,
                code: d.code,
                timestamp: d.timestamp
              }
            }, '*');
          }
        }
      }
    } catch (e) {
      // Silently fail - don't break LeetCode
    }

    return response;
  };

  // ---- Monaco Editor Code Extraction ----
  // Respond to requests from content.js (ISOLATED world)
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;

    if (event.data?.type === 'SAVE_TO_NOTION_GET_CODE') {
      let code = '';
      let language = '';

      try {
        // Try Monaco editor first
        const models = window.monaco?.editor?.getModels();
        if (models && models.length > 0) {
          code = models[0].getValue();
          language = models[0].getLanguageId();
        }
      } catch (e) {
        // Monaco not available
      }

      // Fallback: try reading from DOM .view-lines
      if (!code) {
        try {
          const viewLines = document.querySelector('.view-lines');
          if (viewLines) {
            code = viewLines.textContent || '';
          }
        } catch (e) {
          // DOM fallback also failed
        }
      }

      window.postMessage({
        type: 'SAVE_TO_NOTION_CODE_RESULT',
        payload: { code, language }
      }, '*');
    }
  });
})();
