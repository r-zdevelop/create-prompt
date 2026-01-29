/**
 * File Suggestion Service
 *
 * Suggests relevant files based on task type and project structure.
 * Helps AI focus on the right files for the task.
 */

const fs = require('fs');
const path = require('path');
const { getRelevantPaths } = require('./taskTypeService');
const { scoreRelevance } = require('./relevanceService');

/**
 * Suggest relevant files based on intent and project structure
 * @param {string|Object} intent - Intent string or parsed intent object
 * @param {Object} options - Suggestion options
 * @returns {{ files: Array, directories: Array }}
 */
function suggestRelevantFiles(intent, options = {}) {
  const {
    projectRoot = process.cwd(),
    taskType = null,
    maxFiles = 10,
    maxDirs = 5,
    keywords = []
  } = options;

  const suggestions = {
    files: [],
    directories: []
  };

  // Get relevant paths from task type
  const relevantPaths = taskType ? getRelevantPaths(taskType) : { dirs: [], files: [] };

  // Scan project for matching directories
  const foundDirs = findMatchingDirectories(
    projectRoot,
    relevantPaths.dirs,
    maxDirs
  );
  suggestions.directories = foundDirs;

  // Scan project for matching files
  const foundFiles = findMatchingFiles(
    projectRoot,
    relevantPaths.files,
    keywords,
    maxFiles
  );
  suggestions.files = foundFiles;

  return suggestions;
}

/**
 * Find directories matching patterns
 * @param {string} rootPath - Root path to search
 * @param {string[]} patterns - Directory patterns to match
 * @param {number} maxResults - Maximum results to return
 * @returns {Array<{path: string, pattern: string}>}
 */
function findMatchingDirectories(rootPath, patterns, maxResults = 5) {
  const results = [];
  const ignoreList = ['node_modules', '.git', 'vendor', '.create-prompt', 'dist', 'build', 'coverage'];

  function searchDir(dirPath, depth = 0) {
    if (depth > 3 || results.length >= maxResults) return;

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        if (results.length >= maxResults) break;
        if (ignoreList.includes(item)) continue;

        const itemPath = path.join(dirPath, item);
        try {
          const stats = fs.statSync(itemPath);
          if (!stats.isDirectory()) continue;

          const relativePath = path.relative(rootPath, itemPath);

          // Check if directory matches any pattern
          for (const pattern of patterns) {
            const normalizedPattern = pattern.replace(/\/$/, '').toLowerCase();
            const normalizedPath = relativePath.toLowerCase();

            if (normalizedPath.includes(normalizedPattern) ||
                item.toLowerCase().includes(normalizedPattern)) {
              results.push({
                path: relativePath,
                pattern: pattern,
                name: item
              });
              break;
            }
          }

          // Continue searching subdirectories
          searchDir(itemPath, depth + 1);
        } catch (e) {
          // Skip inaccessible paths
        }
      }
    } catch (e) {
      // Skip unreadable directories
    }
  }

  searchDir(rootPath);
  return results;
}

/**
 * Find files matching patterns
 * @param {string} rootPath - Root path to search
 * @param {string[]} filePatterns - File name patterns to match
 * @param {string[]} keywords - Keywords for relevance scoring
 * @param {number} maxResults - Maximum results to return
 * @returns {Array<{path: string, name: string, score: number}>}
 */
function findMatchingFiles(rootPath, filePatterns, keywords = [], maxResults = 10) {
  const results = [];
  const ignoreList = ['node_modules', '.git', 'vendor', '.create-prompt', 'dist', 'build', 'coverage'];
  const ignoreExtensions = ['.lock', '.log', '.map', '.min.js', '.min.css'];

  function searchDir(dirPath, depth = 0) {
    if (depth > 4 || results.length >= maxResults * 2) return; // Collect more, filter later

    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        if (ignoreList.includes(item)) continue;

        const itemPath = path.join(dirPath, item);
        try {
          const stats = fs.statSync(itemPath);

          if (stats.isDirectory()) {
            searchDir(itemPath, depth + 1);
          } else {
            // Skip ignored extensions
            if (ignoreExtensions.some(ext => item.endsWith(ext))) continue;

            const relativePath = path.relative(rootPath, itemPath);
            const lowerName = item.toLowerCase();

            // Check if file matches any pattern
            let matched = false;
            for (const pattern of filePatterns) {
              const normalizedPattern = pattern.toLowerCase();
              if (lowerName.includes(normalizedPattern)) {
                matched = true;
                break;
              }
            }

            if (matched) {
              // Score relevance if keywords provided
              let score = 0.5; // Base score for pattern match
              if (keywords.length > 0) {
                try {
                  const content = fs.readFileSync(itemPath, 'utf-8').slice(0, 1000);
                  score = scoreRelevance(content, keywords);
                } catch (e) {
                  // Can't read file content, use base score
                }
              }

              results.push({
                path: relativePath,
                name: item,
                score
              });
            }
          }
        } catch (e) {
          // Skip inaccessible paths
        }
      }
    } catch (e) {
      // Skip unreadable directories
    }
  }

  searchDir(rootPath);

  // Sort by score and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Format file suggestions for prompt inclusion
 * @param {{ files: Array, directories: Array }} suggestions - Suggestions object
 * @param {Object} options - Formatting options
 * @returns {string}
 */
function formatFileSuggestions(suggestions, options = {}) {
  const { showScores = false, compact = false } = options;
  const parts = [];

  if (suggestions.directories && suggestions.directories.length > 0) {
    if (!compact) {
      parts.push('**Relevant directories:**');
    }
    const dirLines = suggestions.directories.map(dir =>
      `- \`${dir.path}/\``
    );
    parts.push(dirLines.join('\n'));
  }

  if (suggestions.files && suggestions.files.length > 0) {
    if (!compact) {
      parts.push('\n**Suggested files to examine:**');
    }
    const fileLines = suggestions.files.map(file => {
      let line = `- \`${file.path}\``;
      if (showScores && file.score) {
        line += ` (relevance: ${Math.round(file.score * 100)}%)`;
      }
      return line;
    });
    parts.push(fileLines.join('\n'));
  }

  if (parts.length === 0) {
    return '_No specific files suggested. Examine relevant project areas._';
  }

  return parts.join('\n');
}

/**
 * Get quick file suggestions without full project scan
 * Uses task type patterns directly
 * @param {string} taskType - Task type
 * @returns {{ dirs: string[], files: string[] }}
 */
function getQuickSuggestions(taskType) {
  const relevantPaths = getRelevantPaths(taskType);

  return {
    dirs: relevantPaths.dirs.slice(0, 5),
    files: relevantPaths.files.slice(0, 8)
  };
}

module.exports = {
  suggestRelevantFiles,
  findMatchingDirectories,
  findMatchingFiles,
  formatFileSuggestions,
  getQuickSuggestions
};
