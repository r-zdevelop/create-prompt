const { createCLI } = require('./cli');
const config = require('./config');

// MCP API exports for programmatic usage
const { loadMcpContext, generatePrompt, validateMcpStructure, getMcpSummary } = require('./services/mcpService');
const { loadContext, selectRelevantContext } = require('./services/contextService');
const { loadSchemas, resolveVariable, resolveAllVariables } = require('./services/schemaService');
const { parseIntent, matchTemplates, inferContext } = require('./services/intentService');
const { buildPrompt, applyVariables } = require('./utils/promptBuilder');

// Export main CLI factory and programmatic API
module.exports = {
  createCLI,
  config,

  // MCP API for programmatic usage
  mcp: {
    // High-level API
    loadContext: loadMcpContext,
    generatePrompt,
    validateStructure: validateMcpStructure,
    getSummary: getMcpSummary,

    // Context operations
    context: {
      load: loadContext,
      selectRelevant: selectRelevantContext
    },

    // Schema operations
    schemas: {
      load: loadSchemas,
      resolveVariable,
      resolveAll: resolveAllVariables
    },

    // Intent operations
    intent: {
      parse: parseIntent,
      matchTemplates,
      inferContext
    },

    // Prompt building
    prompt: {
      build: buildPrompt,
      applyVariables
    }
  }
};
