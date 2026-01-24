const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getProjectStructureString } = require('../utils/tree');

/**
 * Update base_prompt.md with project structure
 * @param {string} tree - Project structure tree string
 */
function updateBasePromptWithStructure(tree) {
  const basePromptPath = config.LOCAL_BASE_PATH;

  // Check if base_prompt.md exists
  if (!fs.existsSync(basePromptPath)) {
    console.log('⚠️  base_prompt.md not found, skipping update');
    return;
  }

  let content = fs.readFileSync(basePromptPath, 'utf8');

  // Create the new project structure section
  const newStructureSection = `## Project Structure (if applicable)\n\`\`\`\n${tree}\`\`\`\n\n---\n\n`;

  // Replace the project structure section if it exists
  const structureRegex = /(## Project Structure \(if applicable\)\s*```\s*[\s\S]*?```)/;

  if (structureRegex.test(content)) {
    // Replace existing section
    content = content.replace(structureRegex, newStructureSection.trim());
    fs.writeFileSync(basePromptPath, content);
    console.log(`✅ Updated: ${basePromptPath}`);
  } else {
    // Section doesn't exist, add it before ## History
    const historyRegex = /(## History)/;

    if (historyRegex.test(content)) {
      // Insert before History section
      content = content.replace(historyRegex, `${newStructureSection}$1`);
      fs.writeFileSync(basePromptPath, content);
      console.log(`✅ Added Project Structure section before History in: ${basePromptPath}`);
    } else {
      console.log('⚠️  History section not found in base_prompt.md, cannot add Project Structure');
    }
  }
}

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

  // Update base_prompt.md with the structure
  updateBasePromptWithStructure(tree);

  console.log('\nPreview:\n');
  console.log(tree);
}

module.exports = generateStructure;
