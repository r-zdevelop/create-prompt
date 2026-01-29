const fs = require('fs');
const path = require('path');
const config = require('../config');
const { parseGitignore } = require('../utils/gitignore');
const { getProjectStructureString } = require('../utils/tree');

/**
 * Initialize base template in project
 * Creates .create-prompt directory and copies base template with auto-filled structure
 */
function initializeBaseTemplate() {
  // Create .create-prompt directory
  const promptDir = path.join(process.cwd(), config.PROMPT_DIR);
  if (!fs.existsSync(promptDir)) {
    fs.mkdirSync(promptDir, { recursive: true });
  }

  // Copy template if it doesn't exist
  if (!fs.existsSync(config.LOCAL_BASE_PATH)) {
    fs.copyFileSync(config.BASE_TEMPLATE_PATH, config.LOCAL_BASE_PATH);

    // Auto-fill project structure in base template
    try {
      let baseContent = fs.readFileSync(config.LOCAL_BASE_PATH, 'utf8');
      const projectStructure = getProjectStructureString();

      if (projectStructure) {
        baseContent = baseContent.replace(
          /```\nproject-name\/[\s\S]*?```/,
          '```\n' + projectStructure + '```'
        );
        fs.writeFileSync(config.LOCAL_BASE_PATH, baseContent);
        console.log(config.MESSAGES.BASE_COPIED_WITH_STRUCTURE);
      } else {
        console.log(config.MESSAGES.BASE_COPIED);
      }
    } catch (e) {
      console.log(config.MESSAGES.BASE_COPIED);
    }
  }
}

/**
 * Apply replacements to template content
 * @param {string} content - Template content
 * @param {Object} data - Data to replace in template
 * @returns {string} Processed content
 */
function applyTemplateReplacements(content, data) {
  let result = content;

  // Replace metadata
  result = result.replace('[YYYY-MM-DD]', data.date);

  if (data.tags && data.tags.length > 0) {
    result = result.replace('[tag1, tag2, tag3]', data.tags.join(', '));
  }

  // Set main title
  result = result.replace(/^# \[Main Topic\/Goal\]$/m, `# ${data.promptName}`);

  // Replace task if provided
  if (data.task) {
    result = result.replace(
      '[SPECIFIC USER REQUEST/GOAL - This is what the user wants to achieve]',
      data.task
    );
  }

  // Auto-fill context
  if (data.autoContext) {
    const { environment, tools, version } = data.autoContext;

    if (environment) {
      result = result.replace('[OS/System details]', environment);
    }

    if (tools.length > 0) {
      result = result.replace('[Primary tools/stack]', tools.join(', '));
    }

    if (version) {
      result = result.replace('[Relevant versions]', version);
    }
  }

  // Auto-fill project structure
  const projectStructure = getProjectStructureString();
  if (projectStructure) {
    result = result.replace(
      /```\nproject-name\/[\s\S]*?```/,
      '```\n' + projectStructure + '```'
    );
  }

  // Add to History
  if (data.lastThing && data.lastThing !== 'N/A') {
    const historyLine = `- ${data.lastThing}`;

    if (result.includes("## History")) {
      result = result.replace(
        /(## History[^\n]*\n+)/,
        `$1${historyLine}\n`
      );
    } else {
      result += `\n\n## History\n\n${historyLine}\n`;
    }
  }

  return result;
}

/**
 * Update base template with new history entry
 * @param {string} lastThing - Last thing user did
 */
function updateBaseTemplateHistory(lastThing) {
  if (!lastThing || lastThing === 'N/A') return;

  let baseContent = fs.readFileSync(config.LOCAL_BASE_PATH, 'utf8');
  const baseHistoryLine = `- ${lastThing}`;

  if (baseContent.includes("## History")) {
    baseContent = baseContent.replace(
      /(## History[^\n]*\n+)/,
      `$1${baseHistoryLine}\n`
    );
  } else {
    baseContent += `\n\n## History\n\n${baseHistoryLine}\n`;
  }

  fs.writeFileSync(config.LOCAL_BASE_PATH, baseContent);
}

/**
 * Build prompt from base_prompt.md if it exists
 * @param {string} mcpDir - Path to .create-prompt directory
 * @param {string} task - User task/intent
 * @returns {string|null} Prompt content or null if base_prompt.md doesn't exist
 */
function buildFromBasePrompt(mcpDir, task) {
  const basePromptPath = path.join(mcpDir, 'base_prompt.md');

  if (!fs.existsSync(basePromptPath)) {
    return null;
  }

  const baseContent = fs.readFileSync(basePromptPath, 'utf-8');
  return `${baseContent.trim()}\n\n## Task\n\n${task || ''}`;
}

module.exports = {
  initializeBaseTemplate,
  applyTemplateReplacements,
  updateBaseTemplateHistory,
  buildFromBasePrompt
};
