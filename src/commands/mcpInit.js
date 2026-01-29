/**
 * MCP Init Command
 *
 * Initialize .mcp directory structure with default templates and configuration.
 * Copies template files from the bundled templates directory.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const InputCollector = require('../utils/input');

/**
 * Get the path to bundled MCP templates
 * @returns {string}
 */
function getTemplatesPath() {
  return path.join(__dirname, '../../templates/mcp');
}

/**
 * Copy files from source directory to target directory
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @param {boolean} force - Force overwrite existing files
 * @returns {{ copied: string[], skipped: string[], errors: string[] }}
 */
function copyTemplateFiles(sourceDir, targetDir, force = false) {
  const result = { copied: [], skipped: [], errors: [] };

  if (!fs.existsSync(sourceDir)) {
    return result;
  }

  // Ensure target directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  try {
    const entries = fs.readdirSync(sourceDir);

    for (const entry of entries) {
      const sourcePath = path.join(sourceDir, entry);
      const targetPath = path.join(targetDir, entry);
      const stat = fs.statSync(sourcePath);

      if (stat.isFile()) {
        if (fs.existsSync(targetPath) && !force) {
          result.skipped.push(entry);
        } else {
          fs.copyFileSync(sourcePath, targetPath);
          result.copied.push(entry);
        }
      }
    }
  } catch (error) {
    result.errors.push(error.message);
  }

  return result;
}

/**
 * Default config content (fallback if template not found)
 */
const DEFAULT_CONFIG = {
  version: '1.0',
  defaults: {
    template: 'base',
    target: 'claude',
    includeContext: true,
    format: 'markdown'
  },
  context: {
    autoLoad: ['persona', 'standards', 'instructions'],
    exclude: ['drafts/*']
  },
  schemas: {
    autoResolve: true,
    strictValidation: false
  },
  output: {
    directory: '.mcp',
    filenamePattern: '{{date}}_{{template}}_{{slug}}.md'
  }
};

/**
 * Parse mcp-init command arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} - Parsed options
 */
function parseMcpInitArgs(args) {
  const options = {
    force: false,
    templates: null,
    analyze: false,
    minimal: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--force' || arg === '-f') {
      options.force = true;
    } else if (arg === '--templates') {
      options.templates = args[++i]?.split(',');
    } else if (arg === '--analyze') {
      options.analyze = true;
    } else if (arg === '--minimal') {
      options.minimal = true;
    }
  }

  return options;
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Write file with optional force overwrite
 * @param {string} filePath - File path
 * @param {string|Object} content - Content to write
 * @param {boolean} force - Force overwrite
 * @returns {boolean} - Whether file was written
 */
function writeFile(filePath, content, force = false) {
  if (fs.existsSync(filePath) && !force) {
    return false;
  }

  const data = typeof content === 'object'
    ? JSON.stringify(content, null, 2)
    : content;

  fs.writeFileSync(filePath, data, 'utf-8');
  return true;
}

/**
 * Main mcp-init command function
 * @param {string[]} args - Command line arguments
 */
async function mcpInit(args) {
  const options = parseMcpInitArgs(args);
  const mcpRoot = '.mcp';
  const templatesPath = getTemplatesPath();

  console.log('\n🚀 Initializing MCP context system...\n');

  // Check if already exists
  if (fs.existsSync(mcpRoot) && !options.force) {
    console.log('⚠️  .mcp directory already exists.');
    console.log('   Use --force to overwrite existing files.\n');

    const inputCollector = new InputCollector();
    try {
      const answer = await inputCollector.ask('Continue and add missing files? (y/n) ');
      if (answer.toLowerCase() !== 'y') {
        console.log('Cancelled.\n');
        return;
      }
    } finally {
      inputCollector.close();
    }
  }

  // Create directory structure
  const dirs = [
    mcpRoot,
    path.join(mcpRoot, 'prompts'),
    path.join(mcpRoot, 'context'),
    path.join(mcpRoot, 'schemas')
  ];

  for (const dir of dirs) {
    ensureDir(dir);
    console.log(`   📁 Created: ${dir}/`);
  }

  // Copy prompt templates from bundled templates
  console.log('\n📝 Creating prompt templates...');
  const promptsResult = copyTemplateFiles(
    path.join(templatesPath, 'prompts'),
    path.join(mcpRoot, 'prompts'),
    options.force
  );
  for (const file of promptsResult.copied) {
    console.log(`   ✅ ${file}`);
  }
  for (const file of promptsResult.skipped) {
    console.log(`   ⏭️  ${file} (exists)`);
  }

  // Copy context files (unless minimal)
  if (!options.minimal) {
    console.log('\n📄 Creating context files...');
    const contextResult = copyTemplateFiles(
      path.join(templatesPath, 'context'),
      path.join(mcpRoot, 'context'),
      options.force
    );
    for (const file of contextResult.copied) {
      console.log(`   ✅ ${file}`);
    }
    for (const file of contextResult.skipped) {
      console.log(`   ⏭️  ${file} (exists)`);
    }
  }

  // Copy schema files (unless minimal)
  if (!options.minimal) {
    console.log('\n🔧 Creating schema files...');
    const schemasResult = copyTemplateFiles(
      path.join(templatesPath, 'schemas'),
      path.join(mcpRoot, 'schemas'),
      options.force
    );
    for (const file of schemasResult.copied) {
      console.log(`   ✅ ${file}`);
    }
    for (const file of schemasResult.skipped) {
      console.log(`   ⏭️  ${file} (exists)`);
    }
  }

  // Copy or create config file
  console.log('\n⚙️  Creating configuration...');
  const configSourcePath = path.join(templatesPath, 'config.json');
  const configTargetPath = path.join(mcpRoot, 'config.json');

  if (fs.existsSync(configTargetPath) && !options.force) {
    console.log(`   ⏭️  config.json (exists)`);
  } else if (fs.existsSync(configSourcePath)) {
    fs.copyFileSync(configSourcePath, configTargetPath);
    console.log(`   ✅ config.json`);
  } else {
    writeFile(configTargetPath, DEFAULT_CONFIG, options.force);
    console.log(`   ✅ config.json`);
  }

  // Add .mcp to .gitignore (optional - some may want to track it)
  console.log('\n📋 Checking .gitignore...');
  const gitignorePath = '.gitignore';
  if (fs.existsSync(gitignorePath)) {
    const gitignore = fs.readFileSync(gitignorePath, 'utf-8');
    if (!gitignore.includes('.mcp')) {
      console.log('   ℹ️  Consider adding .mcp to .gitignore if you want to keep it local.');
    } else {
      console.log('   ✅ .mcp already in .gitignore');
    }
  }

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log('\n✅ MCP context system initialized!\n');
  console.log('📂 Structure created:');
  console.log('   .mcp/');
  console.log('   ├── prompts/     → Prompt templates');
  console.log('   ├── context/     → Project context docs');
  console.log('   │   ├── persona.md');
  console.log('   │   ├── standards.md');
  console.log('   │   ├── instructions.md');
  console.log('   │   └── project_structure.md');
  console.log('   ├── schemas/     → Variable schemas');
  console.log('   └── config.json  → Configuration\n');

  console.log('🎯 Next steps:');
  console.log('   1. Edit .mcp/context/ files to build your base_prompt.md');
  console.log('   2. Run: p "your task description"');
  console.log('   3. Or: p e "your task description"\n');
}

module.exports = mcpInit;
