const fs = require('fs');
const path = require('path');
const config = require('../config');
const { getProjectStructureString } = require('../utils/tree');
const { rebuildBasePrompt } = require('../services/contextService');
const { buildRecentActivityMarkdown } = require('../services/gitContextService');

/**
 * Ensure ignore_files.txt exists with default content
 */
function ensureIgnoreFilesExists() {
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const ignoreFilesPath = path.join(promptsDir, 'ignore_files.txt');

  // Ensure .create-prompt directory exists
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }

  // Create ignore_files.txt if it doesn't exist
  if (!fs.existsSync(ignoreFilesPath)) {
    const defaultContent = `# Files and directories to exclude from the generated project structure
# One pattern per line. Wildcards (*) are supported.
.claude/
.vscode/
.idea/
dist/
build/
coverage/
*.old
*.log
package-lock.json
.env*

# Add your own patterns below:
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

  // Ensure .create-prompt/context directory exists
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const contextDir = path.join(promptsDir, 'context');
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  // Save to .create-prompt/context/project_structure.md with YAML frontmatter
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

  // Refresh git recent activity context (skipped outside git repos)
  const activityContent = buildRecentActivityMarkdown();
  if (activityContent) {
    const activityPath = path.join(contextDir, 'recent_activity.md');
    fs.writeFileSync(activityPath, activityContent);
    console.log(`✅ Updated: ${activityPath}`);
  }

  // Rebuild base_prompt.md from all context files
  rebuildBasePrompt(promptsDir);

  console.log('\nPreview:\n');
  console.log(tree);
}

module.exports = generateStructure;
