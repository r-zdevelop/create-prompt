const fs = require('fs');
const path = require('path');

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
  getProjectStructureString
};
