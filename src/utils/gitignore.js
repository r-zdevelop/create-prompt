const fs = require('fs');
const path = require('path');
const config = require('../config');

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

  // Check against all ignore patterns
  for (const pattern of ignorePatterns) {
    // Directory pattern (ends with /)
    if (pattern.endsWith('/') && basename === pattern.slice(0, -1)) {
      return true;
    }

    // Exact match
    if (basename === pattern) {
      return true;
    }

    // Wildcard pattern
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(basename)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Add .prompts to .gitignore if not already present
 * @returns {boolean} True if added, false if already present
 */
function ensurePromptsInGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    return false;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  const lines = gitignoreContent.split('\n');

  const hasPromptsEntry = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === '.prompts' || trimmed === '.prompts/' || trimmed === '/.prompts';
  });

  if (!hasPromptsEntry) {
    const newContent = gitignoreContent.endsWith('\n')
      ? gitignoreContent + '.prompts\n'
      : gitignoreContent + '\n.prompts\n';

    fs.writeFileSync(gitignorePath, newContent);
    return true;
  }

  return false;
}

module.exports = {
  parseGitignore,
  shouldIgnore,
  ensurePromptsInGitignore
};
