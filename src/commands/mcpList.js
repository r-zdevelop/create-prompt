/**
 * MCP List Command
 *
 * List available templates, schemas, and context files.
 */

const fs = require('fs');
const { getMcpSummary, loadMcpContext } = require('../services/mcpService');
const { getContextSummary } = require('../services/contextService');
const { getSchemaSummary, flattenVariables } = require('../services/schemaService');

/**
 * Parse mcp-list command arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} - Parsed options
 */
function parseMcpListArgs(args) {
  const options = {
    type: null, // 'templates', 'schemas', 'context', or null for all
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === 'templates' || arg === 'prompts') {
      options.type = 'templates';
    } else if (arg === 'schemas') {
      options.type = 'schemas';
    } else if (arg === 'context') {
      options.type = 'context';
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  return options;
}

/**
 * Format template for display
 * @param {Object} template - Template object
 * @param {boolean} verbose - Verbose output
 * @returns {string}
 */
function formatTemplate(template, verbose) {
  const lines = [];
  const name = template.name || 'unnamed';
  const desc = template.description || 'No description';
  const sections = Object.keys(template.sections || {}).length;
  const tags = template.tags?.join(', ') || 'none';

  lines.push(`   📝 ${name}`);
  lines.push(`      ${desc}`);

  if (verbose) {
    lines.push(`      Sections: ${sections}`);
    lines.push(`      Tags: ${tags}`);
    if (template.extends) {
      lines.push(`      Extends: ${template.extends}`);
    }
    if (template.variables) {
      const vars = Object.keys(template.variables).join(', ');
      lines.push(`      Variables: ${vars}`);
    }
  }

  return lines.join('\n');
}

/**
 * Format schema for display
 * @param {Object} schema - Schema object
 * @param {boolean} verbose - Verbose output
 * @returns {string}
 */
function formatSchema(schema, verbose) {
  const lines = [];
  const name = schema.name || 'unnamed';
  const desc = schema.data?.description || 'No description';
  const vars = Object.keys(schema.variables || {});

  lines.push(`   🔧 ${name}`);
  lines.push(`      ${desc}`);
  lines.push(`      Variables: ${vars.length}`);

  if (verbose && vars.length > 0) {
    for (const [varName, varDef] of Object.entries(schema.variables)) {
      const value = typeof varDef === 'object' ? varDef.value : varDef;
      const type = typeof varDef === 'object' ? varDef.type : typeof varDef;
      lines.push(`        - ${varName}: ${value} (${type})`);
    }
  }

  return lines.join('\n');
}

/**
 * Format context file for display
 * @param {Object} contextFile - Context file object
 * @param {boolean} verbose - Verbose output
 * @returns {string}
 */
function formatContext(contextFile, verbose) {
  const lines = [];
  const name = contextFile.name || 'unnamed';
  const type = contextFile.meta?.type || 'general';
  const priority = contextFile.meta?.priority || 'normal';
  const tags = contextFile.meta?.tags?.join(', ') || 'none';
  const contentLines = contextFile.content ? contextFile.content.split('\n').length : 0;

  lines.push(`   📄 ${name}`);
  lines.push(`      Type: ${type}, Priority: ${priority}`);

  if (verbose) {
    lines.push(`      Tags: ${tags}`);
    lines.push(`      Lines: ${contentLines}`);

    // Show first few lines of content
    if (contextFile.content) {
      const preview = contextFile.content.split('\n').slice(0, 3).join('\n');
      lines.push(`      Preview:`);
      for (const line of preview.split('\n')) {
        lines.push(`        ${line.slice(0, 60)}${line.length > 60 ? '...' : ''}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * Main mcp-list command function
 * @param {string[]} args - Command line arguments
 */
async function mcpList(args) {
  const options = parseMcpListArgs(args);
  const mcpRoot = '.mcp';

  // Check if .mcp exists
  if (!fs.existsSync(mcpRoot)) {
    console.error('\n❌ .mcp directory not found.');
    console.error('   Run `create-prompt mcp-init` to initialize.\n');
    return;
  }

  // Load MCP context
  const mcpContext = await loadMcpContext(mcpRoot);

  if (mcpContext.errors.length > 0) {
    console.error('\n❌ Errors loading MCP:');
    for (const error of mcpContext.errors) {
      console.error(`   • ${error}`);
    }
    console.error('');
  }

  console.log('\n📦 MCP Context\n');

  // List templates
  if (!options.type || options.type === 'templates') {
    console.log('Templates:');
    const templates = Object.values(mcpContext.prompts);
    if (templates.length === 0) {
      console.log('   (no templates found)\n');
    } else {
      for (const template of templates) {
        console.log(formatTemplate(template, options.verbose));
        console.log('');
      }
    }
  }

  // List schemas
  if (!options.type || options.type === 'schemas') {
    console.log('Schemas:');
    const schemas = Object.values(mcpContext.schemas);
    if (schemas.length === 0) {
      console.log('   (no schemas found)\n');
    } else {
      for (const schema of schemas) {
        console.log(formatSchema(schema, options.verbose));
        console.log('');
      }

      // Show flattened variables if verbose
      if (options.verbose && schemas.length > 0) {
        console.log('   All Variables:');
        const flat = flattenVariables(mcpContext.schemas);
        for (const [path, value] of Object.entries(flat)) {
          console.log(`     {{schema.${path}}} = ${value}`);
        }
        console.log('');
      }
    }
  }

  // List context files
  if (!options.type || options.type === 'context') {
    console.log('Context Files:');
    const contextFiles = Object.values(mcpContext.context);
    if (contextFiles.length === 0) {
      console.log('   (no context files found)\n');
    } else {
      for (const file of contextFiles) {
        console.log(formatContext(file, options.verbose));
        console.log('');
      }
    }
  }

  // Summary
  console.log('─'.repeat(40));
  const summary = await getMcpSummary(mcpRoot);
  console.log(`\nTotal: ${summary.templates.length} templates, ${summary.schemas.length} schemas, ${summary.context.length} context files\n`);

  if (summary.warnings.length > 0 && options.verbose) {
    console.log('⚠️  Warnings:');
    for (const warning of summary.warnings) {
      console.log(`   • ${warning}`);
    }
    console.log('');
  }
}

module.exports = mcpList;
