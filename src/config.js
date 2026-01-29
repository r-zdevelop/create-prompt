const path = require('path');

/**
 * Configuration constants for create-prompt CLI
 */
module.exports = {
  // Directory and file paths
  PROMPT_DIR: '.create-prompt',
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
  ALWAYS_IGNORE: ['node_modules', '.git', '.DS_Store', 'vendor', '.create-prompt'],

  // Version
  VERSION: '1.5.0',

  // Relevance Filtering Configuration
  RELEVANCE: {
    MIN_SCORE: 0.3,                    // Minimum score to include content
    INCLUDE_LATEST_COMMIT: 'auto',     // 'always', 'auto', 'never'
    INCLUDE_HISTORY: 'auto',           // 'always', 'auto', 'never'
    MAX_HISTORY_ITEMS: 5,              // Maximum history entries to include
    MAX_STRUCTURE_FILES: 50,           // Maximum files in focused structure
    ESSENTIAL_CONTEXT: ['persona', 'standards', 'project'],  // Always include these
    EXPAND_SYNONYMS: true              // Enable synonym expansion
  },

  // Task Type Detection Configuration
  TASK_TYPES: {
    DETECTION_THRESHOLD: 0.5,          // Minimum confidence to detect type
    INJECT_REQUIREMENTS: true,         // Auto-inject task requirements
    SUGGEST_FILES: true,               // Suggest relevant files
    FOCUS_STRUCTURE: true              // Use focused project structure
  },

  // MCP Configuration
  MCP: {
    DIR: '.create-prompt',
    PROMPTS_SUBDIR: 'prompts',
    CONTEXT_SUBDIR: 'context',
    SCHEMAS_SUBDIR: 'schemas',
    CONFIG_FILE: 'config.json',

    DEFAULT_TEMPLATE: 'base',
    DEFAULT_TARGET: 'claude',

    SUPPORTED_SCHEMA_FORMATS: ['.json', '.yaml', '.yml'],
    SUPPORTED_CONTEXT_FORMATS: ['.md', '.txt'],
    SUPPORTED_TEMPLATE_FORMAT: '.json',

    TARGETS: {
      claude: { name: 'Claude', maxTokens: 200000 },
      cursor: { name: 'Cursor', maxTokens: 128000 },
      gpt: { name: 'GPT-4', maxTokens: 128000 },
      antigravity: { name: 'Antigravity', maxTokens: 100000 },
      generic: { name: 'Generic', maxTokens: null }
    },

    MESSAGES: {
      NOT_INITIALIZED: 'MCP not initialized. Run `create-prompt mcp-init` first.',
      TEMPLATE_NOT_FOUND: (name) => `Template "${name}" not found, using "base".`,
      SCHEMA_ERROR: (file, error) => `Schema error in ${file}: ${error}`,
      CONTEXT_NOT_FOUND: (file) => `Context file "${file}" not found, skipping.`,
      PROMPT_GENERATED: 'Prompt generated successfully!',
      VALIDATION_FAILED: (count) => `Validation failed with ${count} error(s).`
    }
  },

  // CLI messages
  MESSAGES: {
    WELCOME: (version, mode) => `\ncreate-prompt ${version} ${mode} – your daily prompt framework! \n`,
    PROMPT_CREATED: '\n✨ Prompt created! \n',
    BASE_COPIED: 'base_prompt.md copied to your project',
    BASE_COPIED_WITH_STRUCTURE: 'base_prompt.md copied to your project with auto-generated structure',
    GITIGNORE_UPDATED: '.create-prompt added to .gitignore',
    STRUCTURE_GENERATED: (filename) => `Project structure saved to ${filename}`,
  },

  // Prompts
  PROMPTS: {
    LAST_THING: "\nWhat's the last thing you remember doing in this folder? \n> ",
    PROMPT_NAME: "\nGive this prompt a short name (e.g. 'fix login', 'add dark mode'): ",
    TAGS: "\nTags (comma-separated, e.g. 'frontend, react, bug'): ",
    TASK: "\nWhat do you want to accomplish? (your task/goal): ",
    FINISH_WHAT_DID: "What did you do in this directory? (required)\n> ",
    FINISH_CHANGES: "\nDescribe the changes you performed:\n> ",
  },

  // Validation messages
  VALIDATION: {
    EMPTY_LAST_THING: "Hey, don't leave me hanging! Tell me something ",
    EMPTY_PROMPT_NAME: "Gotta name it, bro!",
  }
};
