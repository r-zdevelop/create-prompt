/**
 * Prompt Builder Utility
 *
 * Assembles prompts from context files.
 * Simple structure: # Title, ## Context sections, ## Task
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
    format = 'markdown'
  } = options;

  const warnings = [];
  const metadata = {
    target,
    format,
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

  // 3. Task section at the end with user's request
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
  estimateTokens
};
