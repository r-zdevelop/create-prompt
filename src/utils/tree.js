const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Generate tree structure recursively
 * @param {string} dirPath - Directory path to scan
 * @param {string[]} ignorePatterns - Patterns to ignore
 * @param {string} prefix - Prefix for tree formatting
 * @param {boolean} isLast - Whether this is the last item
 * @returns {string} Tree structure string
 */
function generateTree(dirPath, ignorePatterns, prefix = '', isLast = true) {
  const { shouldIgnore } = require('./gitignore');

  const items = fs.readdirSync(dirPath)
    .filter(item => !shouldIgnore(path.join(dirPath, item), ignorePatterns))
    .sort((a, b) => {
      const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
      const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
      if (aIsDir === bIsDir) return a.localeCompare(b);
      return aIsDir ? -1 : 1;
    });

  let tree = '';

  items.forEach((item, index) => {
    const itemPath = path.join(dirPath, item);
    const isLastItem = index === items.length - 1;
    const connector = isLastItem ? '└── ' : '├── ';
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
      tree += prefix + connector + item + '/\n';
      const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
      tree += generateTree(itemPath, ignorePatterns, newPrefix, isLastItem);
    } else {
      tree += prefix + connector + item + '\n';
    }
  });

  return tree;
}

/**
 * Generate focused tree structure with relevant paths expanded
 * @param {Object} options - Options for focused tree generation
 * @returns {string} Focused tree structure string
 */
function generateFocusedTree(options = {}) {
  const {
    rootPath = process.cwd(),
    focusPaths = [],          // Paths/patterns to expand fully
    focusFiles = [],          // File name patterns to highlight
    maxDepth = 3,             // Max depth for non-focus paths
    maxFiles = config.RELEVANCE?.MAX_STRUCTURE_FILES || 50,
    collapseThreshold = 5     // Collapse dirs with more than N files
  } = options;

  const { parseGitignore, shouldIgnore } = require('./gitignore');
  const ignorePatterns = parseGitignore();
  const projectName = path.basename(rootPath);

  let fileCount = 0;
  const focusPatterns = focusPaths.map(p => p.toLowerCase().replace(/\/$/, ''));
  const focusFilePatterns = focusFiles.map(f => f.toLowerCase());

  /**
   * Check if path should be expanded (matches focus patterns)
   */
  function shouldExpand(relativePath) {
    const lowerPath = relativePath.toLowerCase();
    return focusPatterns.some(pattern =>
      lowerPath.startsWith(pattern) ||
      pattern.startsWith(lowerPath) ||
      lowerPath.includes(pattern)
    );
  }

  /**
   * Check if file matches focus file patterns
   */
  function isRelevantFile(fileName) {
    const lowerName = fileName.toLowerCase();
    return focusFilePatterns.some(pattern => lowerName.includes(pattern));
  }

  /**
   * Generate tree with focus awareness
   */
  function buildFocusedTree(dirPath, prefix = '', depth = 0, relativePath = '') {
    if (fileCount >= maxFiles) return '';

    let tree = '';

    try {
      const items = fs.readdirSync(dirPath)
        .filter(item => !shouldIgnore(path.join(dirPath, item), ignorePatterns))
        .sort((a, b) => {
          const aIsDir = fs.statSync(path.join(dirPath, a)).isDirectory();
          const bIsDir = fs.statSync(path.join(dirPath, b)).isDirectory();
          if (aIsDir === bIsDir) return a.localeCompare(b);
          return aIsDir ? -1 : 1;
        });

      const isFocusPath = shouldExpand(relativePath);
      const shouldCollapse = !isFocusPath && depth >= maxDepth;

      // Count items in directory
      const dirItems = items.filter(item => {
        const itemPath = path.join(dirPath, item);
        return fs.statSync(itemPath).isDirectory();
      });
      const fileItems = items.filter(item => {
        const itemPath = path.join(dirPath, item);
        return !fs.statSync(itemPath).isDirectory();
      });

      // If we should collapse and there are many items
      if (shouldCollapse && items.length > collapseThreshold) {
        // Only show relevant files in collapsed dirs
        const relevantFiles = fileItems.filter(f => isRelevantFile(f));

        if (relevantFiles.length > 0) {
          relevantFiles.forEach((file, index) => {
            if (fileCount >= maxFiles) return;
            const isLast = index === relevantFiles.length - 1 && dirItems.length === 0;
            const connector = isLast ? '└── ' : '├── ';
            tree += prefix + connector + file + '\n';
            fileCount++;
          });
        }

        // Show collapse indicator
        const hiddenCount = items.length - relevantFiles.length;
        if (hiddenCount > 0) {
          tree += prefix + '└── ... (' + hiddenCount + ' more items)\n';
        }
        return tree;
      }

      items.forEach((item, index) => {
        if (fileCount >= maxFiles) return;

        const itemPath = path.join(dirPath, item);
        const itemRelativePath = relativePath ? `${relativePath}/${item}` : item;
        const isLastItem = index === items.length - 1;
        const connector = isLastItem ? '└── ' : '├── ';
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          tree += prefix + connector + item + '/\n';
          const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
          tree += buildFocusedTree(itemPath, newPrefix, depth + 1, itemRelativePath);
        } else {
          const highlight = isRelevantFile(item) ? ' ◀' : '';
          tree += prefix + connector + item + highlight + '\n';
          fileCount++;
        }
      });
    } catch (e) {
      // Silently skip unreadable directories
    }

    return tree;
  }

  return projectName + '/\n' + buildFocusedTree(rootPath);
}

/**
 * Get focused project structure as formatted string
 * @param {Object} options - Focus options
 * @returns {string} Formatted project structure
 */
function getFocusedProjectStructure(options = {}) {
  try {
    return generateFocusedTree(options);
  } catch (e) {
    return '';
  }
}

/**
 * Get project structure as string with project name
 * @returns {string} Complete project structure
 */
function getProjectStructureString() {
  try {
    const { parseGitignore } = require('./gitignore');
    const ignorePatterns = parseGitignore();
    const projectName = path.basename(process.cwd());
    return projectName + '/\n' + generateTree(process.cwd(), ignorePatterns);
  } catch (e) {
    return '';
  }
}

module.exports = {
  generateTree,
  getProjectStructureString,
  generateFocusedTree,
  getFocusedProjectStructure
};
