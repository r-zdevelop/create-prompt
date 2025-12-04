const path = require('path');

/**
 * Configuration constants for create-prompt CLI
 */
module.exports = {
  // Directory and file paths
  PROMPT_DIR: '.prompts',
  BASE_TEMPLATE_NAME: 'base_prompt.md',

  // Template paths (relative to package root)
  get TEMPLATE_DIR() {
    return path.join(__dirname, '../templates');
  },

  get BASE_TEMPLATE_PATH() {
    return path.join(this.TEMPLATE_DIR, this.BASE_TEMPLATE_NAME);
  },

  get LOCAL_BASE_PATH() {
    return path.join(process.cwd(), this.PROMPT_DIR, this.BASE_TEMPLATE_NAME);
  },

  // Files and directories to always ignore
  ALWAYS_IGNORE: ['node_modules', '.git', '.DS_Store', 'vendor', '.prompts'],

  // Version
  VERSION: '1.2.0',

  // CLI messages
  MESSAGES: {
    WELCOME: (version, mode) => `\ncreate-prompt ${version} ${mode} – your daily prompt framework! \n`,
    PROMPT_CREATED: '\n✨ Prompt created! \n',
    BASE_COPIED: 'base_prompt.md copied to your project',
    BASE_COPIED_WITH_STRUCTURE: 'base_prompt.md copied to your project with auto-generated structure',
    GITIGNORE_UPDATED: '.prompts added to .gitignore',
    STRUCTURE_GENERATED: (filename) => `Project structure saved to ${filename}`,
  },

  // Prompts
  PROMPTS: {
    LAST_THING: "\nWhat's the last thing you remember doing in this folder? \n> ",
    PROMPT_NAME: "\nGive this prompt a short name (e.g. 'fix login', 'add dark mode'): ",
    TAGS: "\nTags (comma-separated, e.g. 'frontend, react, bug'): ",
    TASK: "\nWhat do you want to accomplish? (your task/goal): ",
  },

  // Validation messages
  VALIDATION: {
    EMPTY_LAST_THING: "Hey, don't leave me hanging! Tell me something ",
    EMPTY_PROMPT_NAME: "Gotta name it, bro!",
  }
};
