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
    help: args.includes('--help') || args.includes('-h') || command === 'help',
    quick: args.includes('--quick') || args.includes('-q'),
    noHistory: args.includes('--no-history'),
    projectStructure: args.includes('--project-structure') || command === 'project-structure' || command === 'ps',
    filesMarkdown: args.includes('--files-markdown') || command === 'files-markdown' || command === 'fm',
    finish: args.includes('finish') || command === 'finish' || command === 'f',
    command: command // First argument as command
  };
}

/**
 * Display help information
 * @param {string} version - CLI version
 */
function displayHelp(version) {
  console.log(`
create-prompt v${version}
Your daily prompt framework - creates organized AI prompts with smart auto-filling and context detection.

USAGE:
  p [options]                    Create a new prompt (interactive mode)
  p <command>                    Run a specific command

COMMANDS:
  finish, f                      Finish and save the current prompt
  project-structure, ps          Generate project structure tree
  files-markdown, fm             Generate markdown file with project files
  help                           Show this help message

OPTIONS:
  --quick, -q                    Quick mode (skip auto-detection)
  --no-history                   Don't show recent prompts
  --help, -h                     Show this help message

EXAMPLES:
  p                              Start interactive prompt creation
  p --quick                      Create prompt in quick mode
  p finish                       Finish current prompt
  p f                            Finish current prompt (alias)
  p ps                           Generate project structure
  p fm                           Generate files markdown
  p --help                       Show this help

For more information, visit: https://github.com/r-zdevelop/create-prompt
`);
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

    // Handle help command
    if (options.help) {
      displayHelp(this.version);
      return;
    }

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
