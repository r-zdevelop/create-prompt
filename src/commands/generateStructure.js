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

  // Replace the project structure section
  const structureRegex = /(## Project Structure \(if applicable\)\s*```\s*[\s\S]*?```)/;

  const newStructureSection = `## Project Structure (if applicable)\n\`\`\`\n${tree}\`\`\``;

  if (structureRegex.test(content)) {
    content = content.replace(structureRegex, newStructureSection);
    fs.writeFileSync(basePromptPath, content);
    console.log(`✅ Updated: ${basePromptPath}`);
  } else {
    console.log('⚠️  Project Structure section not found in base_prompt.md');
  }
}

/**
 * Generate and save project structure to a markdown file
 */
function generateStructure() {
  console.log('\nGenerating project structure...\n');

  const tree = getProjectStructureString();

  // Ensure .prompts directory exists
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }

  // Save to .prompts/project_structure.md
  const filename = 'project_structure.md';
  const filePath = path.join(promptsDir, filename);
  const content = `# Project Structure\n\n\`\`\`\n${tree}\`\`\`\n`;

  fs.writeFileSync(filePath, content);

  console.log(config.MESSAGES.STRUCTURE_GENERATED(filePath));

  // Update base_prompt.md with the structure
  updateBasePromptWithStructure(tree);

  console.log('\nPreview:\n');
  console.log(tree);
}

module.exports = generateStructure;
