/**
 * Prompt Builder Utility
 *
 * Assembles final prompts from templates, context, schemas, and intent.
 * Handles variable interpolation, conditional sections, and output formatting.
 */

const { resolveAllVariables } = require('../services/schemaService');

/**
 * Target LLM configurations
 */
const TARGET_CONFIGS = {
  claude: {
    name: 'Claude',
    maxTokens: 200000,
    supportsSystemPrompt: true,
    prefersMarkdown: true
  },
  cursor: {
    name: 'Cursor',
    maxTokens: 128000,
    supportsFileContext: true,
    prefersInline: true
  },
  gpt: {
    name: 'GPT-4',
    maxTokens: 128000,
    supportsSystemPrompt: true,
    prefersMarkdown: true
  },
  antigravity: {
    name: 'Antigravity',
    maxTokens: 100000,
    prefersMarkdown: true
  },
  generic: {
    name: 'Generic',
    maxTokens: null,
    prefersMarkdown: true
  }
};

/**
 * Build a complete prompt from components
 * @param {Object} options - Build options
 * @returns {{ content: string, metadata: Object, warnings: string[] }}
 */
function buildPrompt(options) {
  const {
    intent,
    template,
    context = {},
    schemas = {},
    target = 'claude',
    format = 'markdown',
    includeContext = true,
    sections = {}
  } = options;

  const warnings = [];
  const metadata = {
    template: template?.name || 'base',
    target,
    format,
    timestamp: new Date().toISOString()
  };

  // Build sections
  const builtSections = [];

  // 1. Header section
  const header = buildHeaderSection(intent, template);
  if (header) builtSections.push({ priority: 1, content: header });

  // 2. Context section (if enabled)
  if (includeContext && sections.context !== false) {
    const contextSection = buildContextSection(context, intent);
    if (contextSection) {
      builtSections.push({ priority: 2, content: contextSection });
    }
  }

  // 3. Requirements section
  if (sections.requirements !== false) {
    const reqSection = buildRequirementsSection(intent);
    if (reqSection) builtSections.push({ priority: 3, content: reqSection });
  }

  // 4. Schema/Design section
  if (Object.keys(schemas).length > 0 && sections.design !== false) {
    const designSection = buildDesignSection(schemas, intent, warnings);
    if (designSection) builtSections.push({ priority: 2.5, content: designSection });
  }

  // 5. Constraints section
  if (sections.constraints !== false) {
    const constraints = buildConstraintsSection(template, intent);
    if (constraints) builtSections.push({ priority: 4, content: constraints });
  }

  // 6. Output section
  if (sections.output !== false) {
    const output = buildOutputSection(intent, target);
    builtSections.push({ priority: 5, content: output });
  }

  // Sort by priority and join
  builtSections.sort((a, b) => a.priority - b.priority);
  let content = builtSections.map(s => s.content).join('\n\n');

  // Apply schema variable resolution
  if (Object.keys(schemas).length > 0) {
    const { result, unresolved } = resolveAllVariables(content, schemas);
    content = result;
    if (unresolved.length > 0) {
      warnings.push(`Unresolved variables: ${unresolved.join(', ')}`);
    }
  }

  // Apply target-specific optimizations
  content = optimizeForTarget(content, target);

  // Format output
  content = formatOutput(content, format);

  return { content, metadata, warnings };
}

/**
 * Build header section from intent
 * @param {Object} intent - Parsed intent
 * @param {Object} template - Template object
 * @returns {string}
 */
function buildHeaderSection(intent, template) {
  const action = capitalize(intent.action);
  const subject = intent.components.length > 0
    ? intent.components.join(' and ')
    : 'implementation';

  return `# Task: ${action} ${subject}`;
}

/**
 * Build context section from loaded context files
 * @param {Object} context - Context files object
 * @param {Object} intent - Parsed intent
 * @returns {string | null}
 */
function buildContextSection(context, intent) {
  const files = Object.values(context);
  if (files.length === 0) return null;

  const lines = ['## Context'];

  for (const file of files) {
    lines.push(`### ${capitalize(file.name)}`);
    // Truncate content if too long
    const maxLength = 2000;
    let content = file.content;
    if (content.length > maxLength) {
      content = content.slice(0, maxLength) + '\n\n[Content truncated...]';
    }
    lines.push(content);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build requirements section from intent
 * @param {Object} intent - Parsed intent
 * @returns {string}
 */
function buildRequirementsSection(intent) {
  const lines = ['## Requirements'];

  if (intent.requirements && intent.requirements.length > 0) {
    for (const req of intent.requirements) {
      lines.push(`- ${capitalize(req.description)}`);
    }
  } else {
    lines.push(`- ${intent.raw}`);
  }

  return lines.join('\n');
}

/**
 * Build design section from schemas
 * @param {Object} schemas - Loaded schemas
 * @param {Object} intent - Parsed intent
 * @param {string[]} warnings - Warnings array to push to
 * @returns {string | null}
 */
function buildDesignSection(schemas, intent, warnings) {
  const lines = ['## Design Specifications'];
  let hasContent = false;

  // Check for color schema
  if (schemas.colors) {
    const colors = schemas.colors.variables;
    if (colors) {
      lines.push('\n### Colors');
      for (const [name, value] of Object.entries(colors)) {
        const colorValue = typeof value === 'object' ? value.value : value;
        if (colorValue) {
          lines.push(`- ${capitalize(name)}: ${colorValue}`);
          hasContent = true;
        }
      }
    }
  }

  // Check for specs schema
  if (schemas.specs) {
    lines.push('\n### UI Specifications');
    const specs = schemas.specs.variables || schemas.specs.data;
    if (specs) {
      for (const [name, value] of Object.entries(specs)) {
        const specValue = typeof value === 'object' ? value.value : value;
        if (specValue && typeof specValue !== 'object') {
          lines.push(`- ${capitalize(name)}: ${specValue}`);
          hasContent = true;
        }
      }
    }
  }

  // Include referenced schema values
  for (const ref of intent.references?.schemas || []) {
    const parts = ref.split('.');
    if (parts.length >= 2) {
      const [schemaName, ...varPath] = parts;
      if (schemas[schemaName]) {
        // Reference is to a valid schema
        lines.push(`- ${ref}: {{schema.${ref}}}`);
        hasContent = true;
      }
    }
  }

  return hasContent ? lines.join('\n') : null;
}

/**
 * Build constraints section
 * @param {Object} template - Template object
 * @param {Object} intent - Parsed intent
 * @returns {string}
 */
function buildConstraintsSection(template, intent) {
  const lines = ['## Constraints'];
  const constraints = [];

  // Type-based constraints
  if (intent.types.includes('ui')) {
    constraints.push('Must be accessible (WCAG 2.1 AA)');
    constraints.push('Must be responsive');
    constraints.push('Follow existing component patterns');
  }

  if (intent.types.includes('api')) {
    constraints.push('Follow REST conventions');
    constraints.push('Include proper error handling');
    constraints.push('Validate all inputs');
  }

  if (intent.types.includes('auth')) {
    constraints.push('Follow security best practices');
    constraints.push('Never store plain-text passwords');
    constraints.push('Use secure session management');
  }

  // Default constraints if none detected
  if (constraints.length === 0) {
    constraints.push('Follow existing codebase patterns');
    constraints.push('Include error handling');
    constraints.push('Write clean, maintainable code');
  }

  for (const constraint of constraints) {
    lines.push(`- ${constraint}`);
  }

  return lines.join('\n');
}

/**
 * Build output expectations section
 * @param {Object} intent - Parsed intent
 * @param {string} target - Target LLM
 * @returns {string}
 */
function buildOutputSection(intent, target) {
  const lines = ['## Expected Output'];

  lines.push('\nProvide a complete, production-ready implementation with:');
  lines.push('1. Full source code');
  lines.push('2. Proper types/interfaces (if applicable)');
  lines.push('3. Error handling');
  lines.push('4. Brief inline comments for complex logic');

  // Target-specific additions
  if (target === 'cursor') {
    lines.push('\nNote: This will be used in Cursor IDE, so consider file context.');
  }

  return lines.join('\n');
}

/**
 * Apply target-specific optimizations
 * @param {string} content - Prompt content
 * @param {string} target - Target LLM
 * @returns {string}
 */
function optimizeForTarget(content, target) {
  const config = TARGET_CONFIGS[target] || TARGET_CONFIGS.generic;

  // Add target-specific prefixes or formatting
  if (target === 'claude' && config.supportsSystemPrompt) {
    // Claude works well with the current format
    return content;
  }

  if (target === 'cursor') {
    // Cursor benefits from being more direct
    return content.replace(/## /g, '### ');
  }

  return content;
}

/**
 * Format output based on format type
 * @param {string} content - Prompt content
 * @param {string} format - Output format
 * @returns {string}
 */
function formatOutput(content, format) {
  if (format === 'plain') {
    // Strip markdown
    return content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim();
  }

  if (format === 'json') {
    return JSON.stringify({ prompt: content }, null, 2);
  }

  // Default: markdown
  return content.trim();
}

/**
 * Apply variable replacements to template content
 * @param {string} template - Template string
 * @param {Object} variables - Variables to replace
 * @returns {string}
 */
function applyVariables(template, variables) {
  let result = template;

  // Simple {{variable}} replacement
  result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, varPath) => {
    const value = getNestedValue(variables, varPath);
    return value !== undefined ? String(value) : match;
  });

  // Optional {{?variable}} - remove if missing
  result = result.replace(/\{\{\?(\w+(?:\.\w+)*)\}\}/g, (match, varPath) => {
    const value = getNestedValue(variables, varPath);
    return value !== undefined ? String(value) : '';
  });

  return result;
}

/**
 * Get nested value from object
 * @param {Object} obj - Source object
 * @param {string} path - Dot-separated path
 * @returns {any}
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
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
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Check if prompt fits within target limits
 * @param {string} content - Prompt content
 * @param {string} target - Target LLM
 * @returns {{ fits: boolean, tokens: number, limit: number | null }}
 */
function checkTokenLimits(content, target) {
  const config = TARGET_CONFIGS[target] || TARGET_CONFIGS.generic;
  const tokens = estimateTokens(content);

  return {
    fits: config.maxTokens === null || tokens < config.maxTokens,
    tokens,
    limit: config.maxTokens
  };
}

module.exports = {
  buildPrompt,
  applyVariables,
  optimizeForTarget,
  formatOutput,
  estimateTokens,
  checkTokenLimits,
  TARGET_CONFIGS
};
