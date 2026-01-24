/**
 * Schema Service
 *
 * Responsible for loading, parsing, and validating schemas from .mcp/schemas.
 * Supports JSON and YAML formats.
 */

const fs = require('fs');
const path = require('path');
const { parseYaml } = require('../utils/yamlParser');

/**
 * Load a single schema file
 * @param {string} filePath - Absolute path to schema file
 * @returns {{ name: string, data: Object } | null}
 */
function loadSchema(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');
    let data;

    if (ext === '.json') {
      data = JSON.parse(content);
    } else if (ext === '.yaml' || ext === '.yml') {
      data = parseYaml(content);
    } else {
      return null;
    }

    const name = data.name || path.basename(filePath, ext);

    return {
      name,
      path: filePath,
      data,
      variables: data.variables || {}
    };
  } catch (error) {
    console.error(`Warning: Could not load schema ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Load all schemas from .mcp/schemas directory
 * @param {string} mcpRoot - Path to .mcp directory
 * @returns {{ schemas: Object, errors: string[], warnings: string[] }}
 */
function loadSchemas(mcpRoot = '.mcp') {
  const schemasDir = path.join(mcpRoot, 'schemas');
  const result = { schemas: {}, errors: [], warnings: [] };

  if (!fs.existsSync(schemasDir)) {
    result.warnings.push(`Schemas directory not found: ${schemasDir}`);
    return result;
  }

  try {
    const entries = fs.readdirSync(schemasDir);
    const supportedExtensions = ['.json', '.yaml', '.yml'];

    for (const entry of entries) {
      const ext = path.extname(entry).toLowerCase();
      if (!supportedExtensions.includes(ext)) continue;

      const filePath = path.join(schemasDir, entry);
      const stat = fs.statSync(filePath);

      if (!stat.isFile()) continue;

      // Check file size limit (1MB)
      if (stat.size > 1024 * 1024) {
        result.warnings.push(`Schema file too large (>1MB): ${entry}`);
        continue;
      }

      const schema = loadSchema(filePath);
      if (schema) {
        result.schemas[schema.name] = schema;
      }
    }
  } catch (error) {
    result.errors.push(`Failed to read schemas directory: ${error.message}`);
  }

  return result;
}

/**
 * Resolve a variable path from schemas
 * @param {Object} schemas - Loaded schemas
 * @param {string} variablePath - Path like "colors.primary" or "colors.palettes.dark.primary"
 * @returns {any} - Resolved value or undefined
 */
function resolveVariable(schemas, variablePath) {
  const parts = variablePath.split('.');
  if (parts.length < 2) return undefined;

  const schemaName = parts[0];
  const schema = schemas[schemaName];
  if (!schema) return undefined;

  // Try to resolve from variables first
  let current = schema.variables;
  for (let i = 1; i < parts.length; i++) {
    if (current === undefined || current === null) return undefined;

    const key = parts[i];
    if (typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      // Try in schema data directly (for non-variable fields like palettes)
      current = schema.data;
      for (let j = 1; j < parts.length; j++) {
        if (current === undefined || current === null) return undefined;
        current = current[parts[j]];
      }
      break;
    }
  }

  // If we got a variable object with 'value' property, return the value
  if (current && typeof current === 'object' && 'value' in current) {
    return current.value;
  }

  return current;
}

/**
 * Extract all variable placeholders from a template string
 * @param {string} template - Template string with {{variable}} placeholders
 * @returns {string[]} - Array of variable paths
 */
function extractVariables(template) {
  const regex = /\{\{schema\.([^}]+)\}\}/g;
  const variables = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    variables.push(match[1]);
  }

  return [...new Set(variables)];
}

/**
 * Validate a schema structure
 * @param {Object} schema - Schema object to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateSchema(schema) {
  const errors = [];

  if (!schema.name) {
    errors.push('Schema must have a "name" property');
  }

  if (!schema.variables && !schema.data) {
    errors.push('Schema must have "variables" or data properties');
  }

  if (schema.variables) {
    for (const [key, variable] of Object.entries(schema.variables)) {
      if (typeof variable === 'object' && variable !== null) {
        // Variable objects should have at least a type or value
        if (!variable.type && variable.value === undefined) {
          errors.push(`Variable "${key}" should have "type" or "value" property`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Resolve all schema variables in a template
 * @param {string} template - Template with {{schema.x}} placeholders
 * @param {Object} schemas - Loaded schemas
 * @returns {{ result: string, unresolved: string[] }}
 */
function resolveAllVariables(template, schemas) {
  const unresolved = [];

  const result = template.replace(/\{\{schema\.([^}]+)\}\}/g, (match, varPath) => {
    const value = resolveVariable(schemas, varPath);
    if (value === undefined) {
      unresolved.push(varPath);
      return match; // Keep placeholder if unresolved
    }
    return String(value);
  });

  return { result, unresolved };
}

/**
 * Get a flat map of all variables across schemas
 * @param {Object} schemas - Loaded schemas
 * @returns {Object} - Flat map like { "colors.primary": "#3B82F6" }
 */
function flattenVariables(schemas) {
  const flat = {};

  for (const [schemaName, schema] of Object.entries(schemas)) {
    if (!schema.variables) continue;

    const flatten = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          if ('value' in value) {
            flat[`${schemaName}.${path}`] = value.value;
          } else {
            flatten(value, path);
          }
        } else {
          flat[`${schemaName}.${path}`] = value;
        }
      }
    };

    flatten(schema.variables);
  }

  return flat;
}

/**
 * Get schema summary (names and variable counts)
 * @param {Object} schemas - Loaded schemas
 * @returns {Object[]}
 */
function getSchemaSummary(schemas) {
  return Object.values(schemas).map(schema => ({
    name: schema.name,
    variableCount: Object.keys(schema.variables || {}).length,
    description: schema.data?.description || ''
  }));
}

module.exports = {
  loadSchema,
  loadSchemas,
  resolveVariable,
  extractVariables,
  validateSchema,
  resolveAllVariables,
  flattenVariables,
  getSchemaSummary
};
