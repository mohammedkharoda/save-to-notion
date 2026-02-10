// LeetCode Platform Adapter
import { PlatformAdapter } from './platform-interface.js';

export class LeetCodeAdapter extends PlatformAdapter {
  static matches(url) {
    return /leetcode\.com\/problems\//.test(url);
  }

  static getPlatformName() {
    return 'LeetCode';
  }

  static getPlatformUrl() {
    return 'https://leetcode.com';
  }

  async extractProblemData() {
    const titleSlug = this.getTitleSlug();
    if (!titleSlug) {
      throw new Error('Could not extract problem slug from URL');
    }

    // Fetch problem data from LeetCode GraphQL API
    const problem = await this.fetchProblemData(titleSlug);
    if (!problem) {
      throw new Error('Failed to fetch problem data from LeetCode');
    }

    // Request code from content-extractor.js (MAIN world)
    const { code, language } = await this.requestCode();

    // Get cached submission data if available
    const submission = window.cachedSubmission || {};

    return {
      platform: this.constructor.getPlatformName(),
      problem: {
        questionFrontendId: problem.questionFrontendId || '',
        title: problem.title || '',
        difficulty: problem.difficulty || '',
        content: problem.content || '',
        topicTags: problem.topicTags || [],
        similarQuestions: problem.similarQuestions || []
      },
      url: window.location.href,
      code: code || '',
      language: language || '',
      submission: {
        runtimeDisplay: submission.runtimeDisplay || '',
        runtimePercentile: submission.runtimePercentile || null,
        memoryDisplay: submission.memoryDisplay || '',
        memoryPercentile: submission.memoryPercentile || null
      }
    };
  }

  getTitleSlug() {
    const match = window.location.pathname.match(/\/problems\/([^/]+)/);
    return match ? match[1] : null;
  }

  async fetchProblemData(titleSlug) {
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

  requestCode() {
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
}
