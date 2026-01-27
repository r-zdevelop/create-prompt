const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getProjectStructureString } = require('../utils/tree');
const { rebuildBasePrompt } = require('../services/contextService');

/**
 * Ensure ignore_files.txt exists with default content
 */
function ensureIgnoreFilesExists() {
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const ignoreFilesPath = path.join(promptsDir, 'ignore_files.txt');

  // Ensure .mcp directory exists
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }

  // Create ignore_files.txt if it doesn't exist
  if (!fs.existsSync(ignoreFilesPath)) {
    const defaultContent = `# Add files or directories to ignore in project structure
# One pattern per line
# Examples:
# public/images
# public/css
# node_modules
# *.log
`;
    fs.writeFileSync(ignoreFilesPath, defaultContent);
    console.log(`✅ Created: ${ignoreFilesPath}`);
  }
}

/**
 * Generate and save project structure to a markdown file
 */
function generateStructure() {
  console.log('\nGenerating project structure...\n');

  // Ensure ignore_files.txt exists
  ensureIgnoreFilesExists();

  const tree = getProjectStructureString();

  // Ensure .mcp/context directory exists
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const contextDir = path.join(promptsDir, 'context');
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Save to .mcp/context/project_structure.md with YAML frontmatter
  const filename = 'project_structure.md';
  const filePath = path.join(contextDir, filename);
  const content = `---
type: structure
priority: medium
tags: [architecture, files]
---

# Project Structure

\`\`\`
${tree}\`\`\`
`;

  fs.writeFileSync(filePath, content);

  console.log(config.MESSAGES.STRUCTURE_GENERATED(filePath));

  // Rebuild base_prompt.md from all context files
  rebuildBasePrompt(promptsDir);

  console.log('\nPreview:\n');
  console.log(tree);
}

module.exports = generateStructure;
