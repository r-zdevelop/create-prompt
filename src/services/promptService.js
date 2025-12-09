const fs = require('fs');
const path = require('path');
const config = require('../config');
const { generatePromptFilename } = require('../utils/slugify');
const { applyTemplateReplacements, updateBaseTemplateHistory } = require('./templateService');
const { getAutoContext } = require('./projectService');

/**
 * Create a new prompt file
 * @param {Object} promptData - Prompt data
 * @returns {Object} Created file information
 */
function createPromptFile(promptData) {
  const promptDir = path.join(process.cwd(), config.PROMPT_DIR);

  // Generate filename
  const filename = generatePromptFilename(promptData.promptName, promptDir);
  const fullpath = path.join(promptDir, filename);

  // Copy template
  fs.copyFileSync(config.LOCAL_BASE_PATH, fullpath);

  // Read and modify content
  let content = fs.readFileSync(fullpath, 'utf8');

  // Add auto context
  const autoContext = getAutoContext();

  // Apply all template replacements
  content = applyTemplateReplacements(content, {
    ...promptData,
    autoContext
  });

  // Write modified content
  fs.writeFileSync(fullpath, content);

  // History is now only updated by 'p finish' command
  // updateBaseTemplateHistory(promptData.lastThing);

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
 */
function displaySuccessMessage(info) {
  console.log(config.MESSAGES.PROMPT_CREATED);
  console.log(`Title → "${info.promptName}"`);
  console.log(`File  → ${info.filename}`);
  console.log(`Path  → ${info.fullpath}`);

  if (info.tags.length > 0) {
    console.log(`Tags  → ${info.tags.join(', ')}`);
  }

  console.log('');
}

module.exports = {
  createPromptFile,
  displaySuccessMessage
};
