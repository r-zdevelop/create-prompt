const config = require('../config');
const InputCollector = require('../utils/input');
const { createPromptFile, displaySuccessMessage } = require('../services/promptService');

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
    // Ask for task/goal (mandatory)
    data.task = await input.askWithValidation(
      config.PROMPTS.TASK,
      (answer) => answer ? null : 'Please provide what you want to accomplish',
      'Please provide what you want to accomplish'
    );

    // Ask for prompt name
    data.promptName = await input.askWithValidation(
      config.PROMPTS.PROMPT_NAME,
      (answer) => answer ? null : config.VALIDATION.EMPTY_PROMPT_NAME,
      config.VALIDATION.EMPTY_PROMPT_NAME
    );

    // Ask for tags (skip in quick mode)
    if (!options.quick) {
      data.tags = await input.askTags(config.PROMPTS.TAGS);
    } else {
      data.tags = [];
    }

    // Set lastThing based on task for history tracking
    data.lastThing = data.task;

    return data;
  } finally {
    input.close();
  }
}

/**
 * Main command to create a prompt
 * @param {Object} options - Command options
 */
async function createPrompt(options = {}) {
  // Collect user input
  const promptData = await collectUserInput(options);

  // Create prompt file
  const fileInfo = createPromptFile(promptData);

  // Display success message
  displaySuccessMessage(fileInfo);
}

module.exports = createPrompt;
