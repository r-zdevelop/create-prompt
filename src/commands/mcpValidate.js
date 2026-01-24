/**
 * MCP Validate Command
 *
 * Validate .mcp directory structure and configuration.
 */

const fs = require('fs');
const path = require('path');
const { validateMcpStructure, loadMcpContext } = require('../services/mcpService');
const { validateSchema } = require('../services/schemaService');

/**
 * Parse mcp-validate command arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} - Parsed options
 */
function parseMcpValidateArgs(args) {
  const options = {
    schemas: false,
    templates: false,
    context: false,
    fix: false,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--schemas') {
      options.schemas = true;
    } else if (arg === '--templates') {
      options.templates = true;
    } else if (arg === '--context') {
      options.context = true;
    } else if (arg === '--fix') {
      options.fix = true;
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  }

  // If no specific component selected, validate all
  if (!options.schemas && !options.templates && !options.context) {
    options.schemas = true;
    options.templates = true;
    options.context = true;
  }

  return options;
}

/**
 * Validate templates
 * @param {Object} templates - Loaded templates
 * @param {boolean} verbose - Verbose output
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateTemplates(templates, verbose) {
  const errors = [];
  const warnings = [];

  for (const [name, template] of Object.entries(templates)) {
    // Check required fields
    if (!template.name) {
      warnings.push(`Template '${name}': missing 'name' property`);
    }

    if (!template.sections && !template.extends) {
      errors.push(`Template '${name}': must have 'sections' or 'extends' property`);
    }

    // Check sections
    if (template.sections) {
      for (const [sectionName, section] of Object.entries(template.sections)) {
        if (!section.template && !section.content) {
          warnings.push(`Template '${name}': section '${sectionName}' has no template or content`);
        }

        if (section.priority && typeof section.priority !== 'number') {
          warnings.push(`Template '${name}': section '${sectionName}' priority should be a number`);
        }
      }
    }

    // Check extends reference
    if (template.extends && !templates[template.extends]) {
      warnings.push(`Template '${name}': extends '${template.extends}' which doesn't exist`);
    }

    if (verbose) {
      console.log(`   ✓ ${name}: ${Object.keys(template.sections || {}).length} sections`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate context files
 * @param {Object} contextFiles - Loaded context files
 * @param {boolean} verbose - Verbose output
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateContextFiles(contextFiles, verbose) {
  const errors = [];
  const warnings = [];

  for (const [name, file] of Object.entries(contextFiles)) {
    // Check content length
    if (!file.content || file.content.trim().length === 0) {
      warnings.push(`Context '${name}': file is empty`);
    }

    // Check for placeholder content
    if (file.content && file.content.includes('[Describe')) {
      warnings.push(`Context '${name}': contains placeholder text`);
    }

    // Check metadata
    if (!file.meta.type) {
      warnings.push(`Context '${name}': missing 'type' in frontmatter`);
    }

    if (verbose) {
      const lines = file.content ? file.content.split('\n').length : 0;
      console.log(`   ✓ ${name}: ${lines} lines, type: ${file.meta.type || 'unset'}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate schemas
 * @param {Object} schemas - Loaded schemas
 * @param {boolean} verbose - Verbose output
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateSchemas(schemas, verbose) {
  const errors = [];
  const warnings = [];

  for (const [name, schema] of Object.entries(schemas)) {
    const result = validateSchema(schema);

    if (!result.valid) {
      errors.push(...result.errors.map(e => `Schema '${name}': ${e}`));
    }

    // Additional checks
    const varCount = Object.keys(schema.variables || {}).length;
    if (varCount === 0) {
      warnings.push(`Schema '${name}': no variables defined`);
    }

    if (verbose) {
      console.log(`   ✓ ${name}: ${varCount} variables`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Main mcp-validate command function
 * @param {string[]} args - Command line arguments
 */
async function mcpValidate(args) {
  const options = parseMcpValidateArgs(args);
  const mcpRoot = '.mcp';

  console.log('\n🔍 Validating MCP structure...\n');

  // Check if .mcp exists
  if (!fs.existsSync(mcpRoot)) {
    console.error('❌ .mcp directory not found.');
    console.error('   Run `create-prompt mcp-init` to initialize.\n');
    return;
  }

  // Load all MCP content
  const mcpContext = await loadMcpContext(mcpRoot);

  let totalErrors = [];
  let totalWarnings = [];

  // Validate structure
  const structureResult = validateMcpStructure(mcpRoot);
  totalErrors.push(...structureResult.errors);
  totalWarnings.push(...structureResult.warnings);

  // Validate templates
  if (options.templates) {
    console.log('📝 Templates:');
    if (Object.keys(mcpContext.prompts).length === 0) {
      console.log('   ⚠️  No templates found');
      totalWarnings.push('No templates found in .mcp/prompts/');
    } else {
      const result = validateTemplates(mcpContext.prompts, options.verbose);
      totalErrors.push(...result.errors);
      totalWarnings.push(...result.warnings);
      if (!options.verbose) {
        console.log(`   ${result.valid ? '✅' : '❌'} ${Object.keys(mcpContext.prompts).length} template(s) checked`);
      }
    }
    console.log('');
  }

  // Validate context
  if (options.context) {
    console.log('📄 Context:');
    if (Object.keys(mcpContext.context).length === 0) {
      console.log('   ⚠️  No context files found');
      totalWarnings.push('No context files found in .mcp/context/');
    } else {
      const result = validateContextFiles(mcpContext.context, options.verbose);
      totalErrors.push(...result.errors);
      totalWarnings.push(...result.warnings);
      if (!options.verbose) {
        console.log(`   ${result.valid ? '✅' : '❌'} ${Object.keys(mcpContext.context).length} context file(s) checked`);
      }
    }
    console.log('');
  }

  // Validate schemas
  if (options.schemas) {
    console.log('🔧 Schemas:');
    if (Object.keys(mcpContext.schemas).length === 0) {
      console.log('   ⚠️  No schemas found');
      totalWarnings.push('No schemas found in .mcp/schemas/');
    } else {
      const result = validateSchemas(mcpContext.schemas, options.verbose);
      totalErrors.push(...result.errors);
      totalWarnings.push(...result.warnings);
      if (!options.verbose) {
        console.log(`   ${result.valid ? '✅' : '❌'} ${Object.keys(mcpContext.schemas).length} schema(s) checked`);
      }
    }
    console.log('');
  }

  // Check config
  console.log('⚙️  Config:');
  const configPath = path.join(mcpRoot, 'config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      console.log(`   ✅ config.json is valid JSON`);
      if (options.verbose) {
        console.log(`      Default template: ${config.defaults?.template || 'base'}`);
        console.log(`      Default target: ${config.defaults?.target || 'claude'}`);
      }
    } catch (error) {
      console.log(`   ❌ config.json is invalid: ${error.message}`);
      totalErrors.push(`config.json parse error: ${error.message}`);
    }
  } else {
    console.log('   ⚠️  config.json not found (using defaults)');
    totalWarnings.push('config.json not found');
  }

  // Summary
  console.log('\n' + '─'.repeat(50));

  if (totalErrors.length > 0) {
    console.log('\n❌ Errors:');
    for (const error of totalErrors) {
      console.log(`   • ${error}`);
    }
  }

  if (totalWarnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warning of totalWarnings) {
      console.log(`   • ${warning}`);
    }
  }

  if (totalErrors.length === 0 && totalWarnings.length === 0) {
    console.log('\n✅ All validations passed!\n');
  } else if (totalErrors.length === 0) {
    console.log(`\n✅ Validation passed with ${totalWarnings.length} warning(s).\n`);
  } else {
    console.log(`\n❌ Validation failed with ${totalErrors.length} error(s).\n`);
  }
}

module.exports = mcpValidate;
