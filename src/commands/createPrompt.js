const fs = require('fs');
const path = require('path');
const config = require('../config');
const InputCollector = require('../utils/input');
const { loadContext } = require('../services/contextService');
const { buildFromBasePrompt } = require('../services/templateService');
const { generatePromptFilename } = require('../utils/slugify');

/**
 * Collect user input for prompt creation
 * @param {Object} options - Command options
 * @returns {Promise<Object>} Collected prompt data
 */
async function collectUserInput(options) {
  const input = new InputCollector();
  const data = {
    date: new Date().toISOString().slice(0, 10)
  };

  try {
    // Ask for task - used for both filename and Task section
    data.task = await input.askWithValidation(
      'What do you want to do? ',
      (answer) => answer ? null : 'Task cannot be empty',
      'Task cannot be empty'
    );

    // Use task as the prompt name for filename generation
    data.promptName = data.task;
    data.tags = [];

    return data;
  } finally {
    input.close();
  }
}

/**
 * Build prompt content from base_prompt.md or context files
 * @param {Object} contextFiles - Loaded context files
 * @param {Object} promptData - User input data
 * @param {string} mcpDir - Path to .mcp directory
 * @returns {string} Generated prompt content
 */
function buildPromptFromContext(contextFiles, promptData, mcpDir) {
  // Check for base_prompt.md first
  const basePrompt = buildFromBasePrompt(mcpDir, promptData.task);
  if (basePrompt) {
    return basePrompt;
  }

  // Fallback: build from context files
  const sections = [];

  // Title with single #
  sections.push(`# ${promptData.promptName}`);

  // Context sections with ## headers
  const files = Object.values(contextFiles);
  if (files.length > 0) {
    // Sort by priority (high first)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    files.sort((a, b) => {
      const aPriority = priorityOrder[a.meta.priority] ?? 1;
      const bPriority = priorityOrder[b.meta.priority] ?? 1;
      return aPriority - bPriority;
    });

    for (const file of files) {
      // Add # to all headers (# → ##, ## → ###, etc.)
      let content = file.content;
      content = content.replace(/^(#+) /gm, '#$1 ');
      sections.push('\n' + content);
    }
  }

  // Task section at the end with user's request (always include)
  sections.push(`\n## Task\n\n${promptData.task || ''}`);

  return sections.join('\n');
}

/**
 * Create prompt file in results directory
 * @param {Object} promptData - Prompt data
 * @param {string} content - Generated prompt content
 * @returns {Object} Created file information
 */
function createPromptFile(promptData, content) {
  const mcpDir = path.join(process.cwd(), config.PROMPT_DIR);
  const resultsDir = path.join(mcpDir, 'results');

  // Ensure results directory exists
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Generate filename
  const filename = generatePromptFilename(promptData.promptName, resultsDir);
  const fullpath = path.join(resultsDir, filename);

  // Write content
  fs.writeFileSync(fullpath, content);

  return {
    filename,
    fullpath,
    promptName: promptData.promptName,
    tags: promptData.tags || []
  };
}

/**
 * Display prompt creation success message
 * @param {Object} info - Prompt file information
 * @param {number} contextCount - Number of context files used
 */
function displaySuccessMessage(info, contextCount) {
  console.log(config.MESSAGES.PROMPT_CREATED);
  console.log(`Title   → "${info.promptName}"`);
  console.log(`File    → ${info.filename}`);
  console.log(`Path    → ${info.fullpath}`);
  console.log(`Context → ${contextCount} file(s) included`);

  if (info.tags.length > 0) {
    console.log(`Tags    → ${info.tags.join(', ')}`);
  }

  console.log('');
}

/**
 * Main command to create a prompt
 * @param {Object} options - Command options
 */
async function createPrompt(options = {}) {
  const mcpDir = path.join(process.cwd(), config.PROMPT_DIR);

  // Load context files from .mcp/context/
  const contextResult = loadContext(mcpDir);

  if (contextResult.errors.length > 0) {
    console.error('❌ Errors loading context:');
    contextResult.errors.forEach(err => console.error(`   ${err}`));
  }

  if (contextResult.warnings.length > 0 && Object.keys(contextResult.files).length === 0) {
    console.log('⚠️  No context files found in .mcp/context/');
    console.log('   Run `p ps` to generate project structure first.\n');
  }

  // Collect user input
  const promptData = await collectUserInput(options);

  // Build prompt from context (or base_prompt.md if exists)
  const content = buildPromptFromContext(contextResult.files, promptData, mcpDir);

  // Create prompt file in results directory
  const fileInfo = createPromptFile(promptData, content);

  // Display success message
  displaySuccessMessage(fileInfo, Object.keys(contextResult.files).length);
}

module.exports = createPrompt;
