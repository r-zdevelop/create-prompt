const config = require('./config');
const { ensurePromptsInGitignore } = require('./utils/gitignore');
const { initializeBaseTemplate } = require('./services/templateService');
const { createPrompt, generateStructure, generateFilesMarkdown, finishCommand } = require('./commands');

/**
 * Parse command line arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} Parsed options
 */
function parseArguments(args) {
  const command = args[0];

  return {
    quick: args.includes('--quick') || args.includes('-q'),
    noHistory: args.includes('--no-history'),
    projectStructure: args.includes('--project-structure') || command === 'project-structure' || command === 'ps',
    filesMarkdown: args.includes('--files-markdown') || command === 'files-markdown' || command === 'fm',
    finish: args.includes('finish'),
    command: command // First argument as command
  };
}

/**
 * Initialize project environment
 * - Create .prompts directory
 * - Add .prompts to .gitignore
 * - Initialize base template
 */
function initializeEnvironment() {
  // Add .prompts to .gitignore
  if (ensurePromptsInGitignore()) {
    console.log(config.MESSAGES.GITIGNORE_UPDATED);
  }

  // Initialize base template
  initializeBaseTemplate();
}

/**
 * Main CLI application
 */
class CLI {
  constructor() {
    this.version = config.VERSION;
  }

  /**
   * Run the CLI application
   * @param {string[]} args - Command line arguments
   */
  async run(args) {
    const options = parseArguments(args);

    // Handle 'finish' command
    if (options.command === 'finish' || options.finish) {
      await finishCommand();
      return;
    }

    // Handle project-structure command (project-structure, ps, or --project-structure)
    if (options.projectStructure) {
      generateStructure();
      return;
    }

    // Handle --files-markdown flag
    if (options.filesMarkdown) {
      await generateFilesMarkdown();
      return;
    }

    // Initialize environment
    initializeEnvironment();

    // Display welcome message
    const mode = options.quick ? '(quick mode)' : '(smart mode)';
    console.log(config.MESSAGES.WELCOME(`v${this.version}`, mode));

    // Run main command
    await createPrompt(options);
  }
}

/**
 * Create and return a CLI instance
 * @returns {CLI} CLI instance
 */
function createCLI() {
  return new CLI();
}

module.exports = {
  createCLI,
  parseArguments
};
