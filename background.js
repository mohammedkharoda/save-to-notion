import { createNotionPage, searchDatabases, queryDatabaseByUrl, appendSolutionToPage, countSolutionsOnPage, queryAllPages } from './notion-api.js';

// ---- Message Handler ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.type === 'GET_AUTH_STATUS') {
    chrome.storage.local.get(
      ['notionApiKey', 'selectedDatabaseId', 'selectedDatabaseName'],
      (data) => {
        sendResponse({
          isConfigured: !!data.notionApiKey && !!data.selectedDatabaseId,
          hasApiKey: !!data.notionApiKey,
          databaseId: data.selectedDatabaseId || null,
          databaseName: data.selectedDatabaseName || null
        });
      }
    );
    return true;
  }

  if (message.type === 'FETCH_DATABASES') {
    chrome.storage.local.get(['notionApiKey'], async (data) => {
      if (!data.notionApiKey) {
        sendResponse({ success: false, error: 'API key not configured. Open extension settings.' });
        return;
      }
      try {
        const databases = await searchDatabases(data.notionApiKey);
        sendResponse({ success: true, data: databases });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }

  if (message.type === 'SELECT_DATABASE') {
    chrome.storage.local.set({
      selectedDatabaseId: message.databaseId,
      selectedDatabaseName: message.databaseName
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'SAVE_TO_NOTION') {
    chrome.storage.local.get(['notionApiKey', 'selectedDatabaseId'], async (data) => {
      if (!data.notionApiKey) {
        sendResponse({ success: false, error: 'API key not configured. Open extension settings.' });
        return;
      }
      if (!data.selectedDatabaseId) {
        sendResponse({ success: false, error: 'No database selected. Open extension settings.' });
        return;
      }
      try {
        const result = await createNotionPage(
          data.notionApiKey,
          data.selectedDatabaseId,
          message.payload
        );
        // Invalidate stats cache after successful save
        await chrome.storage.local.remove('statsCache');
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }

  if (message.type === 'TEST_CONNECTION') {
    (async () => {
      try {
        const databases = await searchDatabases(message.apiKey);
        sendResponse({ success: true, data: databases });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  if (message.type === 'ANALYZE_CODE') {
    (async () => {
      try {
        const storage = await chrome.storage.local.get(['geminiApiKey']);
        if (!storage.geminiApiKey) {
          sendResponse({ success: false, error: 'Gemini API key not configured. Add it in Settings.' });
          return;
        }

        const { problemTitle, difficulty, code, language } = message.payload;

        const prompt = `You are a coding interview expert. Analyze the following LeetCode solution and return a JSON object with exactly these fields:
- "timeComplexity": the time complexity in Big-O notation (e.g., "O(n)", "O(n log n)")
- "spaceComplexity": the space complexity in Big-O notation (e.g., "O(1)", "O(n)")
- "approach": the primary algorithm/technique used (e.g., "Two Pointers", "Dynamic Programming", "BFS", "DFS", "Binary Search", "Sliding Window", "Stack", "Hash Map", "Greedy", "Backtracking", "Union Find", "Trie", "Heap", "Monotonic Stack", "Bit Manipulation")
- "tips": a string with 2-4 bullet points of tips and common mistakes for this problem/approach, each on a new line starting with "- "

Problem: ${problemTitle} (${difficulty})
Language: ${language}

Code:
${code}

Return ONLY valid JSON, no markdown, no code fences, no extra text.`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${storage.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Gemini API error: ${response.status}`);
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const analysis = JSON.parse(cleanedText);

        sendResponse({
          success: true,
          data: {
            timeComplexity: analysis.timeComplexity || '',
            spaceComplexity: analysis.spaceComplexity || '',
            approach: analysis.approach || '',
            tips: analysis.tips || ''
          }
        });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    return true;
  }

  // ---- Duplicate Detection ----
  if (message.type === 'CHECK_DUPLICATE') {
    chrome.storage.local.get(['notionApiKey', 'selectedDatabaseId'], async (data) => {
      if (!data.notionApiKey || !data.selectedDatabaseId) {
        sendResponse({ success: true, data: null });
        return;
      }
      try {
        const existing = await queryDatabaseByUrl(
          data.notionApiKey,
          data.selectedDatabaseId,
          message.url
        );
        sendResponse({ success: true, data: existing });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }

  // ---- Append Solution to Existing Page ----
  if (message.type === 'APPEND_SOLUTION') {
    chrome.storage.local.get(['notionApiKey'], async (data) => {
      if (!data.notionApiKey) {
        sendResponse({ success: false, error: 'API key not configured.' });
        return;
      }
      try {
        const solutionNumber = await countSolutionsOnPage(
          data.notionApiKey,
          message.pageId
        );
        const result = await appendSolutionToPage(
          data.notionApiKey,
          message.pageId,
          message.payload,
          solutionNumber
        );
        // Invalidate stats cache
        await chrome.storage.local.remove('statsCache');
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }

  // ---- Show Notification (for auto-save) ----
  if (message.type === 'SHOW_NOTIFICATION') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: message.title || 'Save to Notion',
      message: message.message || 'Action completed.'
    });
    sendResponse({ success: true });
    return true;
  }

  // ---- Get Stats (Progress Dashboard) ----
  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(['notionApiKey', 'selectedDatabaseId', 'statsCache'], async (data) => {
      if (!data.notionApiKey || !data.selectedDatabaseId) {
        sendResponse({ success: false, error: 'Not configured.' });
        return;
      }

      // Check cache (5-minute TTL)
      if (data.statsCache && (Date.now() - data.statsCache.timestamp < 5 * 60 * 1000)) {
        sendResponse({ success: true, data: data.statsCache.stats });
        return;
      }

      try {
        const pages = await queryAllPages(data.notionApiKey, data.selectedDatabaseId);

        let total = 0, easy = 0, medium = 0, hard = 0;
        const solvedDates = [];

        for (const page of pages) {
          total++;
          const diff = page.properties?.Difficulty?.select?.name;
          if (diff === 'Easy') easy++;
          else if (diff === 'Medium') medium++;
          else if (diff === 'Hard') hard++;

          const dateStr = page.properties?.['Date Solved']?.date?.start;
          if (dateStr) solvedDates.push(dateStr);
        }

        // Calculate streak
        solvedDates.sort((a, b) => b.localeCompare(a)); // newest first
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const uniqueDates = [...new Set(solvedDates)];
        for (let i = 0; i < uniqueDates.length; i++) {
          const expected = new Date(today);
          expected.setDate(expected.getDate() - i);
          const expectedStr = expected.toISOString().split('T')[0];
          if (uniqueDates[i] === expectedStr) {
            streak++;
          } else {
            break;
          }
        }

        const stats = { total, easy, medium, hard, streak };

        // Cache results
        await chrome.storage.local.set({
          statsCache: { timestamp: Date.now(), stats }
        });

        sendResponse({ success: true, data: stats });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }
});

// ---- Keyboard Shortcuts ----
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    return;
  }

  switch(command) {
    case 'quick-save':
      await handleQuickSave(tab);
      break;
    case 'extract-data':
      await handleExtractData(tab);
      break;
  }
});

async function handleQuickSave(tab) {
  try {
    // Check if on a supported platform (currently only LeetCode)
    const isLeetCode = /leetcode\.com\/problems\//.test(tab.url);

    if (!isLeetCode) {
      // Show overlay on page
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_OVERLAY',
        message: 'Not on a LeetCode problem page',
        overlayType: 'error'
      });
      return;
    }

    // Check configuration
    const { notionApiKey, selectedDatabaseId } = await chrome.storage.local.get([
      'notionApiKey',
      'selectedDatabaseId'
    ]);

    if (!notionApiKey || !selectedDatabaseId) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_OVERLAY',
        message: 'Please configure extension in settings first',
        overlayType: 'error'
      });
      return;
    }

    // Show extracting overlay
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_OVERLAY',
      message: 'Extracting problem data...',
      overlayType: 'info'
    });

    // Extract problem data
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'EXTRACT_DATA' });

    if (!response || response.error) {
      throw new Error(response?.error || 'Failed to extract problem data');
    }

    // Build payload with empty optional fields (user can fill later if needed)
    const payload = {
      platform: response.platform || 'LeetCode',
      problem: response.problem,
      code: response.code,
      language: response.language,
      submission: response.submission,
      url: response.url,
      runtime: '', // Empty - user can add later
      space: '', // Empty - user can add later
      approach: '', // Empty - user can add later
      tips: '' // Empty - user can add later
    };

    // Save to Notion
    const saveResult = await createNotionPage(
      notionApiKey,
      selectedDatabaseId,
      payload
    );

    // Invalidate stats cache
    await chrome.storage.local.remove('statsCache');

    // Show success overlay and notification
    const problemTitle = `${response.problem.questionFrontendId}. ${response.problem.title}`;

    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_OVERLAY',
      message: `Saved "${problemTitle}" to Notion!`,
      overlayType: 'success'
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Save to Notion',
      message: `✅ "${problemTitle}" saved successfully!`
    });

  } catch (error) {
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_OVERLAY',
      message: error.message,
      overlayType: 'error'
    });

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Save to Notion - Error',
      message: `❌ ${error.message}`
    });
  }
}

async function handleExtractData(tab) {
  // Open the popup (which will automatically extract data)
  chrome.action.openPopup();
}
