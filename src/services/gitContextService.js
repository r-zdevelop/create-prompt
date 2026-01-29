/**
 * Git Context Service
 *
 * Provides git history filtering based on task relevance.
 * Filters commits and history to only include task-relevant entries.
 */

const { scoreRelevance, extractTaskKeywords, isRelevant } = require('./relevanceService');
const config = require('../config');

/**
 * Parse commits from a commit log string
 * @param {string} commitLog - Raw commit log output
 * @returns {Array<{hash: string, message: string, date: string, author: string}>}
 */
function parseCommits(commitLog) {
  const commits = [];
  const lines = commitLog.split('\n').filter(line => line.trim());

  for (const line of lines) {
    // Try to parse different commit formats
    // Format: "hash - message (date)" or "hash message" or just "message"
    const fullMatch = line.match(/^([a-f0-9]{7,40})\s*[-–]\s*(.+?)(?:\s*\(([^)]+)\))?$/i);
    const simpleMatch = line.match(/^([a-f0-9]{7,40})\s+(.+)$/i);
    const messageOnly = line.match(/^[-*]\s*(.+)$/);

    if (fullMatch) {
      commits.push({
        hash: fullMatch[1],
        message: fullMatch[2].trim(),
        date: fullMatch[3] || '',
        author: ''
      });
    } else if (simpleMatch) {
      commits.push({
        hash: simpleMatch[1],
        message: simpleMatch[2].trim(),
        date: '',
        author: ''
      });
    } else if (messageOnly) {
      commits.push({
        hash: '',
        message: messageOnly[1].trim(),
        date: '',
        author: ''
      });
    } else if (line.trim() && !line.startsWith('#')) {
      // Fallback: treat as message
      commits.push({
        hash: '',
        message: line.trim(),
        date: '',
        author: ''
      });
    }
  }

  return commits;
}

/**
 * Get relevant commits based on task keywords
 * @param {string} commitLog - Raw commit log or history content
 * @param {string[]} keywords - Task keywords
 * @param {Object} options - Filter options
 * @returns {Array<{hash: string, message: string, score: number}>}
 */
function getRelevantCommits(commitLog, keywords, options = {}) {
  const {
    minScore = config.RELEVANCE?.MIN_SCORE || 0.3,
    maxItems = config.RELEVANCE?.MAX_HISTORY_ITEMS || 5
  } = options;

  const commits = parseCommits(commitLog);

  // Score each commit
  const scored = commits.map(commit => ({
    ...commit,
    score: scoreRelevance(commit.message, keywords)
  }));

  // Filter by minimum score and sort by score
  const relevant = scored
    .filter(commit => commit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);

  return relevant;
}

/**
 * Filter history content to only include relevant entries
 * @param {string} historyContent - Full history content
 * @param {string[]} keywords - Task keywords
 * @param {Object} options - Filter options
 * @returns {{ filtered: string, count: number, totalCount: number }}
 */
function filterHistory(historyContent, keywords, options = {}) {
  const {
    minScore = config.RELEVANCE?.MIN_SCORE || 0.3,
    maxItems = config.RELEVANCE?.MAX_HISTORY_ITEMS || 5,
    preserveHeader = true
  } = options;

  const lines = historyContent.split('\n');
  const result = [];
  let headerLines = [];
  let entryCount = 0;
  let relevantCount = 0;

  // Find header (lines before first commit-like entry)
  let headerEnded = false;
  for (const line of lines) {
    if (!headerEnded && (line.startsWith('#') || line.trim() === '')) {
      headerLines.push(line);
    } else {
      headerEnded = true;
      const score = scoreRelevance(line, keywords);
      entryCount++;

      if (score >= minScore && relevantCount < maxItems) {
        result.push(line);
        relevantCount++;
      }
    }
  }

  // Build filtered content
  let filtered = '';
  if (preserveHeader && headerLines.length > 0) {
    filtered = headerLines.join('\n') + '\n';
  }
  filtered += result.join('\n');

  // Add summary if items were filtered out
  if (entryCount > relevantCount) {
    filtered += `\n\n_Showing ${relevantCount} of ${entryCount} entries relevant to your task._`;
  }

  return {
    filtered,
    count: relevantCount,
    totalCount: entryCount
  };
}

/**
 * Check if latest commit is relevant to the task
 * @param {string} latestCommitContent - Latest commit content
 * @param {string[]} keywords - Task keywords
 * @param {number} threshold - Relevance threshold
 * @returns {{ relevant: boolean, score: number, message: string }}
 */
function getLatestCommitIfRelevant(latestCommitContent, keywords, threshold = 0.3) {
  if (!latestCommitContent || !latestCommitContent.trim()) {
    return { relevant: false, score: 0, message: '' };
  }

  const score = scoreRelevance(latestCommitContent, keywords);
  const commits = parseCommits(latestCommitContent);
  const message = commits.length > 0 ? commits[0].message : latestCommitContent.trim();

  return {
    relevant: score >= threshold,
    score,
    message
  };
}

/**
 * Format commits for context inclusion
 * @param {Array} commits - Array of commit objects with scores
 * @param {Object} options - Formatting options
 * @returns {string}
 */
function formatCommitsForContext(commits, options = {}) {
  const { showScores = false, format = 'list' } = options;

  if (commits.length === 0) {
    return '_No relevant commits found for this task._';
  }

  if (format === 'list') {
    return commits.map(commit => {
      let line = `- ${commit.message}`;
      if (commit.hash) {
        line = `- \`${commit.hash.slice(0, 7)}\` ${commit.message}`;
      }
      if (commit.date) {
        line += ` (${commit.date})`;
      }
      if (showScores) {
        line += ` [relevance: ${Math.round(commit.score * 100)}%]`;
      }
      return line;
    }).join('\n');
  }

  // Compact format
  return commits.map(c => c.message).join(', ');
}

/**
 * Create a filtered history context object
 * @param {Object} originalContext - Original history context file
 * @param {string[]} keywords - Task keywords
 * @param {Object} options - Filter options
 * @returns {Object} - Filtered context object
 */
function createFilteredHistoryContext(originalContext, keywords, options = {}) {
  if (!originalContext || !originalContext.content) {
    return originalContext;
  }

  const { filtered, count, totalCount } = filterHistory(
    originalContext.content,
    keywords,
    options
  );

  return {
    ...originalContext,
    content: filtered,
    meta: {
      ...(originalContext.meta || {}),
      filtered: true,
      relevantItems: count,
      totalItems: totalCount
    }
  };
}

module.exports = {
  parseCommits,
  getRelevantCommits,
  filterHistory,
  getLatestCommitIfRelevant,
  formatCommitsForContext,
  createFilteredHistoryContext
};
