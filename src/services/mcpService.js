/**
 * MCP Service
 *
 * Main orchestration service for the MCP context system.
 * Coordinates loading, validation, and prompt generation.
 */

const fs = require('fs');
const path = require('path');
const { loadContext, selectRelevantContext } = require('./contextService');
const { loadSchemas, validateSchema } = require('./schemaService');
const { parseIntent, matchTemplates, inferContext } = require('./intentService');
const { buildPrompt } = require('../utils/promptBuilder');

/**
 * Default MCP configuration
 */
const DEFAULT_CONFIG = {
  defaults: {
    template: 'base',
    target: 'claude',
    includeContext: true,
    format: 'markdown'
  },
  context: {
    autoLoad: ['project', 'architecture'],
    exclude: []
  },
  schemas: {
    autoResolve: true,
    strictValidation: false
  }
};

/**
 * Load MCP configuration from .mcp/config.json
 * @param {string} mcpRoot - Path to .mcp directory
 * @returns {Object} - Merged configuration
 */
function loadMcpConfig(mcpRoot = '.mcp') {
  const configPath = path.join(mcpRoot, 'config.json');

  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf-8');
      const userConfig = JSON.parse(content);
      return mergeConfig(DEFAULT_CONFIG, userConfig);
    }
  } catch (error) {
    console.error(`Warning: Could not load MCP config: ${error.message}`);
  }

  return DEFAULT_CONFIG;
}

/**
 * Deep merge configuration objects
 * @param {Object} base - Base config
 * @param {Object} override - Override config
 * @returns {Object} - Merged config
 */
function mergeConfig(base, override) {
  const result = { ...base };

  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = mergeConfig(base[key] || {}, value);
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Load all MCP context (prompts, context, schemas)
 * @param {string} mcpRoot - Path to .mcp directory
 * @returns {{ prompts: Object, context: Object, schemas: Object, config: Object, errors: string[], warnings: string[] }}
 */
async function loadMcpContext(mcpRoot = '.mcp') {
  const result = {
    prompts: {},
    context: {},
    schemas: {},
    config: {},
    errors: [],
    warnings: []
  };

  // Check if .mcp exists
  if (!fs.existsSync(mcpRoot)) {
    result.errors.push(`MCP directory not found: ${mcpRoot}`);
    return result;
  }

  // Load configuration
  result.config = loadMcpConfig(mcpRoot);

  // Load prompt templates
  const promptsResult = loadPromptTemplates(mcpRoot);
  result.prompts = promptsResult.templates;
  result.errors.push(...promptsResult.errors);
  result.warnings.push(...promptsResult.warnings);

  // Load context files
  const contextResult = loadContext(mcpRoot);
  result.context = contextResult.files;
  result.errors.push(...contextResult.errors);
  result.warnings.push(...contextResult.warnings);

  // Load schemas
  const schemasResult = loadSchemas(mcpRoot);
  result.schemas = schemasResult.schemas;
  result.errors.push(...schemasResult.errors);
  result.warnings.push(...schemasResult.warnings);

  return result;
}

/**
 * Load prompt templates from .mcp/prompts
 * @param {string} mcpRoot - Path to .mcp directory
 * @returns {{ templates: Object, errors: string[], warnings: string[] }}
 */
function loadPromptTemplates(mcpRoot) {
  const promptsDir = path.join(mcpRoot, 'prompts');
  const result = { templates: {}, errors: [], warnings: [] };

  if (!fs.existsSync(promptsDir)) {
    result.warnings.push(`Prompts directory not found: ${promptsDir}`);
    return result;
  }

  try {
    const entries = fs.readdirSync(promptsDir);

    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;

      const filePath = path.join(promptsDir, entry);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const template = JSON.parse(content);
        const name = template.name || path.basename(entry, '.json');
        result.templates[name] = template;
      } catch (error) {
        result.errors.push(`Failed to parse template ${entry}: ${error.message}`);
      }
    }
  } catch (error) {
    result.errors.push(`Failed to read prompts directory: ${error.message}`);
  }

  return result;
}

/**
 * Validate MCP directory structure
 * @param {string} mcpRoot - Path to .mcp directory
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateMcpStructure(mcpRoot = '.mcp') {
  const errors = [];
  const warnings = [];

  // Check root exists
  if (!fs.existsSync(mcpRoot)) {
    errors.push(`MCP directory not found: ${mcpRoot}`);
    return { valid: false, errors, warnings };
  }

  // Check subdirectories
  const subdirs = ['prompts', 'context', 'schemas'];
  for (const subdir of subdirs) {
    const subdirPath = path.join(mcpRoot, subdir);
    if (!fs.existsSync(subdirPath)) {
      warnings.push(`Subdirectory not found: ${subdir}/`);
    }
  }

  // Validate schemas
  const schemasDir = path.join(mcpRoot, 'schemas');
  if (fs.existsSync(schemasDir)) {
    const schemasResult = loadSchemas(mcpRoot);
    for (const [name, schema] of Object.entries(schemasResult.schemas)) {
      const validation = validateSchema(schema);
      if (!validation.valid) {
        warnings.push(`Schema '${name}' has issues: ${validation.errors.join(', ')}`);
      }
    }
  }

  // Validate templates (basic JSON structure)
  const promptsDir = path.join(mcpRoot, 'prompts');
  if (fs.existsSync(promptsDir)) {
    const files = fs.readdirSync(promptsDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(promptsDir, file), 'utf-8');
        const template = JSON.parse(content);
        if (!template.name && !template.sections) {
          warnings.push(`Template '${file}' should have 'name' or 'sections' property`);
        }
      } catch (error) {
        errors.push(`Invalid JSON in ${file}: ${error.message}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Generate a contextualized prompt from intent
 * @param {string} intentString - User intent string
 * @param {Object} options - Generation options
 * @returns {{ prompt: string, metadata: Object, warnings: string[] }}
 */
async function generatePrompt(intentString, options = {}) {
  const {
    mcpRoot = '.mcp',
    template: templateName,
    target = 'claude',
    includeContext = true,
    contextFiles = null,
    variables = {},
    format = 'markdown'
  } = options;

  const warnings = [];

  // Load MCP context
  const mcpContext = await loadMcpContext(mcpRoot);
  warnings.push(...mcpContext.warnings);

  if (mcpContext.errors.length > 0) {
    return {
      prompt: null,
      metadata: { errors: mcpContext.errors },
      warnings
    };
  }

  // Parse intent
  const parsedIntent = parseIntent(intentString);

  // Select template
  const selectedTemplate = templateName
    ? mcpContext.prompts[templateName]
    : mcpContext.prompts[matchTemplates(parsedIntent, mcpContext.prompts)];

  if (!selectedTemplate && Object.keys(mcpContext.prompts).length > 0) {
    warnings.push(`Template '${templateName}' not found, using first available`);
  }

  // Select relevant context
  let selectedContext = {};
  if (includeContext) {
    if (contextFiles) {
      // Use specified context files
      for (const name of contextFiles) {
        if (mcpContext.context[name]) {
          selectedContext[name] = mcpContext.context[name];
        } else {
          warnings.push(`Context file '${name}' not found`);
        }
      }
    } else {
      // Auto-select relevant context
      const relevantNames = inferContext(parsedIntent, mcpContext.context);
      for (const name of relevantNames) {
        selectedContext[name] = mcpContext.context[name];
      }
    }
  }

  // Build prompt
  const result = buildPrompt({
    intent: parsedIntent,
    template: selectedTemplate,
    context: selectedContext,
    schemas: mcpContext.schemas,
    target,
    format,
    includeContext
  });

  warnings.push(...result.warnings);

  return {
    prompt: result.content,
    metadata: {
      ...result.metadata,
      intent: {
        action: parsedIntent.action,
        components: parsedIntent.components,
        types: parsedIntent.types,
        confidence: parsedIntent.confidence
      },
      contextUsed: Object.keys(selectedContext),
      schemasUsed: Object.keys(mcpContext.schemas)
    },
    warnings
  };
}

/**
 * Get summary of MCP configuration
 * @param {string} mcpRoot - Path to .mcp directory
 * @returns {Object} - Summary object
 */
async function getMcpSummary(mcpRoot = '.mcp') {
  const mcpContext = await loadMcpContext(mcpRoot);

  return {
    initialized: mcpContext.errors.length === 0 || !mcpContext.errors.some(e => e.includes('not found')),
    templates: Object.keys(mcpContext.prompts),
    context: Object.keys(mcpContext.context),
    schemas: Object.keys(mcpContext.schemas),
    config: mcpContext.config.defaults,
    errors: mcpContext.errors,
    warnings: mcpContext.warnings
  };
}

module.exports = {
  loadMcpContext,
  loadMcpConfig,
  validateMcpStructure,
  generatePrompt,
  getMcpSummary,
  DEFAULT_CONFIG
};
