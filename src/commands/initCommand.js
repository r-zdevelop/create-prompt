const fs = require('fs');
const path = require('path');
const config = require('../config');
const { ensurePromptsInGitignore } = require('../utils/gitignore');
const { initializeBaseTemplate } = require('../services/templateService');
const { buildProjectInfoMarkdown } = require('../services/projectService');
const generateStructure = require('./generateStructure');
const { ensureRequestedFilesExists } = require('./generateFilesMarkdown');

/**
 * Initialize create-prompt in the current project
 * - Scaffold the .create-prompt directory (context/, results/, base_prompt.md)
 * - Add .create-prompt to .gitignore (creating .gitignore if needed)
 * - Generate the project structure (same as `p ps`)
 */
function initCommand() {
  console.log('\nInitializing create-prompt...\n');

  // Scaffold .create-prompt directory with base template
  initializeBaseTemplate();

  // Scaffold context/ and results/ directories
  const promptDir = path.join(process.cwd(), config.PROMPT_DIR);
  for (const dir of ['context', 'results']) {
    const dirPath = path.join(promptDir, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created: ${path.join(config.PROMPT_DIR, dir)}/`);
    }
  }

  // Generate project info context (kept if it already exists, so edits survive)
  const projectInfoPath = path.join(promptDir, 'context', 'project_info.md');
  if (!fs.existsSync(projectInfoPath)) {
    fs.writeFileSync(projectInfoPath, buildProjectInfoMarkdown());
    console.log(`✅ Created: ${path.join(config.PROMPT_DIR, 'context', 'project_info.md')}`);
  }

  // Install workflow instructions context (kept if it already exists)
  const instructionsPath = path.join(promptDir, 'context', 'instructions.md');
  if (!fs.existsSync(instructionsPath)) {
    fs.copyFileSync(config.INSTRUCTIONS_TEMPLATE_PATH, instructionsPath);
    console.log(`✅ Created: ${path.join(config.PROMPT_DIR, 'context', 'instructions.md')}`);
  }

  // Scaffold requested_files.txt so `p fm` is ready to use
  ensureRequestedFilesExists();

  // Add .create-prompt to .gitignore
  if (ensurePromptsInGitignore({ createIfMissing: true })) {
    console.log(config.MESSAGES.GITIGNORE_UPDATED);
  }

  // Generate project structure (same as `p ps`)
  generateStructure();

  console.log(config.MESSAGES.INIT_DONE);
}

module.exports = initCommand;
