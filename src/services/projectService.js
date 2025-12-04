const fs = require('fs');
const path = require('path');

/**
 * Auto-detect context from package.json
 * @returns {Object} Context information
 */
function getAutoContext() {
  const context = {
    environment: process.platform,
    tools: [],
    version: ''
  };

  const pkgPath = path.join(process.cwd(), 'package.json');

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      if (pkg.dependencies) {
        const mainTools = Object.keys(pkg.dependencies).slice(0, 5);
        context.tools = mainTools;
      }

      if (pkg.engines && pkg.engines.node) {
        context.version = `Node ${pkg.engines.node}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  return context;
}

module.exports = {
  getAutoContext
};
