// Platform Adapter Interface
// Base class that all platform adapters must extend

export class PlatformAdapter {
  constructor() {}

  // Static method to check if this adapter matches the given URL
  static matches(url) {
    throw new Error('matches() must be implemented by platform adapter');
  }

  // Static method to get the platform name
  static getPlatformName() {
    throw new Error('getPlatformName() must be implemented by platform adapter');
  }

  // Static method to get the platform base URL
  static getPlatformUrl() {
    throw new Error('getPlatformUrl() must be implemented by platform adapter');
  }

  // Extract problem data from the current page
  // Returns standardized data structure
  async extractProblemData() {
    return {
      platform: this.constructor.getPlatformName(),
      problem: {
        questionFrontendId: '',
        title: '',
        difficulty: '', // Easy, Medium, or Hard
        content: '',
        topicTags: [],
        similarQuestions: []
      },
      url: window.location.href,
      code: '',
      language: '',
      submission: {
        runtimeDisplay: '',
        runtimePercentile: null,
        memoryDisplay: '',
        memoryPercentile: null
      }
    };
  }

  // Extract submission data (for submission history feature)
  async extractSubmissionData() {
    return {
      status: 'Unknown',
      runtime: '',
      memory: '',
      testsPassed: '',
      timestamp: new Date().toISOString(),
      code: '',
      language: ''
    };
  }

  // Helper method to extract code from the page
  extractCode() {
    return '';
  }

  // Helper method to extract language from the page
  extractLanguage() {
    return '';
  }
}
