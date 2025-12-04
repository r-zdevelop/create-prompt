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
    // Ask for last thing (skip if --no-history)
    if (!options.noHistory) {
      data.lastThing = await input.askWithValidation(
        config.PROMPTS.LAST_THING,
        (answer) => answer ? null : config.VALIDATION.EMPTY_LAST_THING,
        config.VALIDATION.EMPTY_LAST_THING
      );
    } else {
      data.lastThing = 'N/A';
    }

    // Ask for prompt name
    data.promptName = await input.askWithValidation(
      config.PROMPTS.PROMPT_NAME,
      (answer) => answer ? null : config.VALIDATION.EMPTY_PROMPT_NAME,
      config.VALIDATION.EMPTY_PROMPT_NAME
    );

    // Ask for tags and task (skip in quick mode)
    if (!options.quick) {
      data.tags = await input.askTags(config.PROMPTS.TAGS);
      data.task = await input.ask(config.PROMPTS.TASK);
    } else {
      data.tags = [];
      data.task = '';
    }

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
