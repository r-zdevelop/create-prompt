const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Parse .mcp/ignore_files.txt and return additional ignore patterns
 * @returns {string[]} Array of ignore patterns
 */
function parseIgnoreFiles() {
  const ignoreFilesPath = path.join(process.cwd(), config.PROMPT_DIR, 'ignore_files.txt');
  const ignorePatterns = [];

  if (fs.existsSync(ignoreFilesPath)) {
    const content = fs.readFileSync(ignoreFilesPath, 'utf8');
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    ignorePatterns.push(...lines);
  }

  return ignorePatterns;
}

/**
 * Parse .gitignore file and return ignore patterns
 * @returns {string[]} Array of ignore patterns
 */
function parseGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const ignorePatterns = [...config.ALWAYS_IGNORE];

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    const lines = content
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));

    ignorePatterns.push(...lines);
  }

  // Add patterns from .mcp/ignore_files.txt
  ignorePatterns.push(...parseIgnoreFiles());

  return ignorePatterns;
}

/**
 * Check if a path should be ignored based on ignore patterns
 * @param {string} itemPath - Path to check
 * @param {string[]} ignorePatterns - Array of ignore patterns
 * @returns {boolean} True if should be ignored
 */
function shouldIgnore(itemPath, ignorePatterns) {
  const basename = path.basename(itemPath);
  const relativePath = path.relative(process.cwd(), itemPath);

  // Check against all ignore patterns
  for (const pattern of ignorePatterns) {
    // Directory pattern (ends with /)
    if (pattern.endsWith('/')) {
      const dirPattern = pattern.slice(0, -1);
      if (basename === dirPattern || relativePath === dirPattern || relativePath.startsWith(dirPattern + path.sep)) {
        return true;
      }
    }

    // Check relative path match (for paths like public/images)
    if (relativePath === pattern || relativePath.startsWith(pattern + path.sep)) {
      return true;
    }

    // Exact match
    if (basename === pattern) {
      return true;
    }

    // Wildcard pattern
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(basename) || regex.test(relativePath)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Add .mcp to .gitignore if not already present
 * @returns {boolean} True if added, false if already present
 */
function ensureMcpInGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    return false;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const lines = gitignoreContent.split('\n');

  const hasMcpEntry = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === '.mcp' || trimmed === '.mcp/' || trimmed === '/.mcp';
  });

  if (!hasMcpEntry) {
    const newContent = gitignoreContent.endsWith('\n')
      ? gitignoreContent + '.mcp\n'
      : gitignoreContent + '\n.mcp\n';

    fs.writeFileSync(gitignorePath, newContent);
    return true;
  }

  return false;
}

// Keep old name for backwards compatibility
const ensurePromptsInGitignore = ensureMcpInGitignore;

module.exports = {
  parseGitignore,
  parseIgnoreFiles,
  shouldIgnore,
  ensureMcpInGitignore,
  ensurePromptsInGitignore
};
