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

/**
 * Detect project metadata from package.json and the environment
 * @returns {Object} Project information
 */
function getProjectInfo() {
  const info = {
    name: path.basename(process.cwd()),
    description: '',
    version: '',
    platform: process.platform,
    nodeVersion: process.version,
    engines: '',
    scripts: [],
    dependencies: [],
    devDependencies: []
  };

  const pkgPath = path.join(process.cwd(), 'package.json');

  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      if (pkg.name) info.name = pkg.name;
      if (pkg.description) info.description = pkg.description;
      if (pkg.version) info.version = pkg.version;
      if (pkg.engines && pkg.engines.node) info.engines = `Node ${pkg.engines.node}`;
      if (pkg.scripts) {
        info.scripts = Object.entries(pkg.scripts).map(([name, cmd]) => ({ name, cmd }));
      }
      if (pkg.dependencies) info.dependencies = Object.keys(pkg.dependencies);
      if (pkg.devDependencies) info.devDependencies = Object.keys(pkg.devDependencies);
    } catch (e) {
      // Ignore parse errors
    }
  }

  return info;
}

/**
 * Build a project_info.md context file from detected project metadata
 * @returns {string} Markdown content with YAML frontmatter
 */
function buildProjectInfoMarkdown() {
  const info = getProjectInfo();
  const lines = [
    '---',
    'type: project',
    'priority: high',
    'tags: [project, stack, environment]',
    '---',
    '',
    '# Project Info',
    '',
    `- **Name:** ${info.name}`
  ];

  if (info.description) lines.push(`- **Description:** ${info.description}`);
  if (info.version) lines.push(`- **Version:** ${info.version}`);
  lines.push(`- **Platform:** ${info.platform}`);
  lines.push(`- **Node:** ${info.engines || info.nodeVersion}`);
  lines.push(`- **Dependencies:** ${info.dependencies.length > 0 ? info.dependencies.join(', ') : 'none (zero-dependency)'}`);
  if (info.devDependencies.length > 0) {
    lines.push(`- **Dev Dependencies:** ${info.devDependencies.join(', ')}`);
  }

  if (info.scripts.length > 0) {
    lines.push('', '## Scripts', '');
    for (const script of info.scripts) {
      lines.push(`- \`npm run ${script.name}\` — ${script.cmd}`);
    }
  }

  lines.push('');
  return lines.join('\n');
}

module.exports = {
  getAutoContext,
  getProjectInfo,
  buildProjectInfoMarkdown
};
