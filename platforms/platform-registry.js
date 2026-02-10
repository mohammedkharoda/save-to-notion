// Platform Registry
// Central registry for all platform adapters

import { LeetCodeAdapter } from './leetcode-adapter.js';
// Import other adapters as they are implemented
// import { HackerRankAdapter } from './hackerrank-adapter.js';
// import { CodeforcesAdapter } from './codeforces-adapter.js';
// import { CodeChefAdapter } from './codechef-adapter.js';
// import { AtCoderAdapter } from './atcoder-adapter.js';

export class PlatformRegistry {
  static platforms = [
    LeetCodeAdapter,
    // HackerRankAdapter,
    // CodeforcesAdapter,
    // CodeChefAdapter,
    // AtCoderAdapter
  ];

  // Detect which platform the given URL belongs to
  static detectPlatform(url) {
    if (!url) return null;
    return this.platforms.find(platform => platform.matches(url)) || null;
  }

  // Get list of all supported platforms
  static getSupportedPlatforms() {
    return this.platforms.map(platform => ({
      name: platform.getPlatformName(),
      url: platform.getPlatformUrl()
    }));
  }

  // Check if a URL is from a supported platform
  static isSupported(url) {
    return this.detectPlatform(url) !== null;
  }
}
