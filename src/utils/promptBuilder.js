/**
 * Prompt Builder Utility
 *
 * Assembles prompts from context files.
 * Simple structure: # Title, ## Context sections, ## Task
 * Enhanced with requirements injection and file suggestions.
 */

/**
 * Build a complete prompt from context files
 * @param {Object} options - Build options
 * @returns {{ content: string, metadata: Object, warnings: string[] }}
 */
function buildPrompt(options) {
  const {
    intent,
    context = {},
    target = 'claude',
    format = 'markdown',
    // New enhanced options
    taskType = 'general',
    taskConfig = null,
    taskRequirements = [],
    fileSuggestions = null,
    keywords = []
  } = options;

  const warnings = [];
  const metadata = {
    target,
    format,
    taskType,
    timestamp: new Date().toISOString()
  };

  const sections = [];

  // 1. Title with single #
  const title = buildTitle(intent);
  sections.push(title);

  // 2. Context sections with ## headers
  const contextContent = buildContextSections(context);
  if (contextContent) {
    sections.push(contextContent);
  }

  // 3. Requirements section (if applicable)
  if (taskRequirements && taskRequirements.length > 0) {
    const requirementsSection = buildRequirementsSection(taskRequirements, taskConfig);
    sections.push(requirementsSection);
  }

  // 4. File suggestions section (if applicable)
  if (fileSuggestions && (fileSuggestions.dirs?.length > 0 || fileSuggestions.files?.length > 0)) {
    const suggestionsSection = buildFileSuggestionsSection(fileSuggestions, taskConfig);
    sections.push(suggestionsSection);
  }

  // 5. Task section at the end with user's request
  const taskSection = buildTaskSection(intent);
  sections.push(taskSection);

  let content = sections.join('\n\n');

  // Format output
  content = formatOutput(content, format);

  return { content, metadata, warnings };
}

/**
 * Build title section with single #
 * @param {Object} intent - Parsed intent
 * @returns {string}
 */
function buildTitle(intent) {
  const action = capitalize(intent.action);
  const subject = intent.components.length > 0
    ? intent.components.join(' and ')
    : 'implementation';

  return `# ${action} ${subject}`;
}

/**
 * Build context sections from loaded files
 * Each section gets ## header
 * @param {Object} context - Context files object
 * @returns {string | null}
 */
function buildContextSections(context) {
  const files = Object.values(context);
  if (files.length === 0) return null;

  const sections = [];

  // Sort by priority (high first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  files.sort((a, b) => {
    const aPriority = priorityOrder[a.meta?.priority] ?? 1;
    const bPriority = priorityOrder[b.meta?.priority] ?? 1;
    return aPriority - bPriority;
  });

  for (const file of files) {
    // Add # to all headers (# → ##, ## → ###, etc.)
    let content = file.content;
    content = content.replace(/^(#+) /gm, '#$1 ');

    sections.push(content);
  }

  return sections.join('\n\n');
}

/**
 * Build task section with user's request
 * @param {Object} intent - Parsed intent
 * @returns {string}
 */
function buildTaskSection(intent) {
  return `## Task

${intent.raw}`;
}

/**
 * Format output based on format type
 * @param {string} content - Prompt content
 * @param {string} format - Output format
 * @returns {string}
 */
function formatOutput(content, format) {
  if (format === 'plain') {
    return content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim();
  }

  if (format === 'json') {
    return JSON.stringify({ prompt: content }, null, 2);
  }

  return content.trim();
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string}
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Build requirements section
 * @param {string[]} requirements - Task-specific requirements
 * @param {Object} taskConfig - Task type configuration
 * @returns {string}
 */
function buildRequirementsSection(requirements, taskConfig = null) {
  const taskName = taskConfig?.name || 'Task';
  const header = `## ${taskName} Requirements`;

  const items = requirements.map(req => `- ${req}`).join('\n');

  return `${header}\n\n${items}`;
}

/**
 * Build file suggestions section
 * @param {{ dirs: string[], files: string[] }} suggestions - File suggestions
 * @param {Object} taskConfig - Task type configuration
 * @returns {string}
 */
function buildFileSuggestionsSection(suggestions, taskConfig = null) {
  const parts = [];

  parts.push('## Suggested Files to Examine');

  if (suggestions.dirs && suggestions.dirs.length > 0) {
    parts.push('\n**Relevant directories:**');
    const dirList = suggestions.dirs.slice(0, 5).map(dir => `- \`${dir}\``).join('\n');
    parts.push(dirList);
  }

  if (suggestions.files && suggestions.files.length > 0) {
    parts.push('\n**Files to look for:**');
    const fileList = suggestions.files.slice(0, 8).map(file => `- Files containing: \`${file}\``).join('\n');
    parts.push(fileList);
  }

  return parts.join('\n');
}

/**
 * Estimate token count (rough approximation)
 * @param {string} text - Text to estimate
 * @returns {number}
 */
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

module.exports = {
  buildPrompt,
  formatOutput,
  estimateTokens,
  buildRequirementsSection,
  buildFileSuggestionsSection
};
