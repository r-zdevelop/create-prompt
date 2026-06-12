const fs = require('fs');
const path = require('path');
const config = require('../config');
const { ensurePromptsInGitignore } = require('../utils/gitignore');
const { initializeBaseTemplate } = require('../services/templateService');
const generateStructure = require('./generateStructure');

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

  // Add .create-prompt to .gitignore
  if (ensurePromptsInGitignore({ createIfMissing: true })) {
    console.log(config.MESSAGES.GITIGNORE_UPDATED);
  }

  // Generate project structure (same as `p ps`)
  generateStructure();

  console.log(config.MESSAGES.INIT_DONE);
}

module.exports = initCommand;
