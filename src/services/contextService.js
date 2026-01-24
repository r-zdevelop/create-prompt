/**
 * Context Service
 *
 * Responsible for loading and parsing context files from .mcp/context directory.
 * Supports Markdown files with optional YAML frontmatter.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Parse YAML frontmatter from markdown content
 * @param {string} content - File content with potential frontmatter
 * @returns {{ meta: Object, content: string }}
 */
function parseContextMeta(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { meta: {}, content: content.trim() };
  }

  const yamlContent = match[1];
  const markdownContent = match[2];

  // Simple YAML parser for frontmatter (key: value pairs)
  const meta = {};
  const lines = yamlContent.split('\n');

  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle arrays [item1, item2]
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map(v => v.trim());
    }
    // Handle quoted strings
    else if ((value.startsWith('"') && value.endsWith('"')) ||
             (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    meta[key] = value;
  }

  return { meta, content: markdownContent.trim() };
}

/**
 * Load a single context file
 * @param {string} filePath - Absolute path to context file
 * @returns {{ name: string, meta: Object, content: string } | null}
 */
function loadContextFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const rawContent = fs.readFileSync(filePath, 'utf-8');
    const { meta, content } = parseContextMeta(rawContent);
    const name = path.basename(filePath, path.extname(filePath));

    return {
      name,
      path: filePath,
      meta,
      content
    };
  } catch (error) {
    console.error(`Warning: Could not load context file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Load all context files from .mcp/context directory
 * @param {string} mcpRoot - Path to .mcp directory
 * @returns {{ files: Object, errors: string[] }}
 */
function loadContext(mcpRoot = '.mcp') {
  const contextDir = path.join(mcpRoot, 'context');
  const result = { files: {}, errors: [], warnings: [] };

  if (!fs.existsSync(contextDir)) {
    result.warnings.push(`Context directory not found: ${contextDir}`);
    return result;
  }

  try {
    const entries = fs.readdirSync(contextDir);
    const supportedExtensions = ['.md', '.txt'];

    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (!supportedExtensions.includes(ext)) continue;

      const filePath = path.join(contextDir, entry);
      const stat = fs.statSync(filePath);

      if (!stat.isFile()) continue;

      // Check file size limit (512KB)
      if (stat.size > 512 * 1024) {
        result.warnings.push(`Context file too large (>512KB): ${entry}`);
        continue;
      }

      const contextFile = loadContextFile(filePath);
      if (contextFile) {
        const key = contextFile.name;
        result.files[key] = contextFile;
      }
    }
  } catch (error) {
    result.errors.push(`Failed to read context directory: ${error.message}`);
  }

  return result;
}

/**
 * Select relevant context files based on tags or keywords
 * @param {Object} contextFiles - Loaded context files
 * @param {string[]} keywords - Keywords to match
 * @param {Object} options - Selection options
 * @returns {Object[]} - Array of relevant context files
 */
function selectRelevantContext(contextFiles, keywords = [], options = {}) {
  const {
    includeAll = false,
    priorityThreshold = 'low',
    maxFiles = 10
  } = options;

  if (includeAll) {
    return Object.values(contextFiles).slice(0, maxFiles);
  }

  const priorityOrder = { high: 3, medium: 2, low: 1 };
  const threshold = priorityOrder[priorityThreshold] || 1;
  const normalizedKeywords = keywords.map(k => k.toLowerCase());

  const scored = Object.values(contextFiles).map(file => {
    let score = 0;

    // Priority score
    const filePriority = priorityOrder[file.meta.priority] || 1;
    if (filePriority >= threshold) {
      score += filePriority * 10;
    }

    // Tag matching
    const tags = Array.isArray(file.meta.tags) ? file.meta.tags : [];
    for (const tag of tags) {
      if (normalizedKeywords.includes(tag.toLowerCase())) {
        score += 5;
      }
    }

    // Keyword in name
    for (const keyword of normalizedKeywords) {
      if (file.name.toLowerCase().includes(keyword)) {
        score += 3;
      }
    }

    // Keyword in content (basic)
    const lowerContent = file.content.toLowerCase();
    for (const keyword of normalizedKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 1;
      }
    }

    return { ...file, score };
  });

  return scored
    .filter(f => f.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxFiles);
}

/**
 * Get context summary (names and types only)
 * @param {Object} contextFiles - Loaded context files
 * @returns {Object[]}
 */
function getContextSummary(contextFiles) {
  return Object.values(contextFiles).map(file => ({
    name: file.name,
    type: file.meta.type || 'general',
    priority: file.meta.priority || 'normal',
    tags: file.meta.tags || []
  }));
}

module.exports = {
  loadContext,
  loadContextFile,
  parseContextMeta,
  selectRelevantContext,
  getContextSummary
};
