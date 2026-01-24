/**
 * YAML Parser Utility
 *
 * Lightweight YAML parser for schema files.
 * Supports common YAML features without external dependencies.
 */

/**
 * Parse YAML content into JavaScript object
 * @param {string} content - YAML content string
 * @returns {Object} - Parsed JavaScript object
 */
function parseYaml(content) {
  const lines = content.split('\n');
  const result = {};
  const stack = [{ indent: -1, obj: result }];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    // Calculate indentation
    const indent = line.search(/\S/);
    const trimmed = line.trim();

    // Handle list items
    if (trimmed.startsWith('- ')) {
      const value = trimmed.slice(2).trim();

      // Find the parent
      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1];
      const parentKey = parent.currentKey;

      if (parentKey && parent.obj[parentKey] === undefined) {
        parent.obj[parentKey] = [];
      }

      if (parentKey && Array.isArray(parent.obj[parentKey])) {
        // Check if it's a key-value pair in the list item
        if (value.includes(':')) {
          const obj = {};
          const [itemKey, itemValue] = splitFirst(value, ':');
          if (itemValue.trim()) {
            obj[itemKey.trim()] = parseValue(itemValue.trim());
          }
          parent.obj[parentKey].push(obj);
          stack.push({ indent: indent + 2, obj, currentKey: itemKey.trim() });
        } else {
          parent.obj[parentKey].push(parseValue(value));
        }
      }
      continue;
    }

    // Handle key-value pairs
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    // Pop stack to correct level
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];

    if (value === '' || value === '|' || value === '>') {
      // Nested object or multiline string
      if (value === '|' || value === '>') {
        // Multiline string - collect following indented lines
        const multilineIndent = indent + 2;
        let multiline = [];
        while (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextIndent = nextLine.search(/\S/);
          if (nextIndent >= multilineIndent || nextLine.trim() === '') {
            multiline.push(nextLine.slice(multilineIndent));
            i++;
          } else {
            break;
          }
        }
        parent.obj[key] = value === '|'
          ? multiline.join('\n').trimEnd()
          : multiline.join(' ').trim();
      } else {
        // Nested object
        parent.obj[key] = {};
        stack.push({ indent, obj: parent.obj[key], currentKey: null });
      }
      parent.currentKey = key;
    } else {
      // Simple value
      parent.obj[key] = parseValue(value);
      parent.currentKey = key;
    }
  }

  return result;
}

/**
 * Split string on first occurrence of separator
 * @param {string} str - String to split
 * @param {string} sep - Separator
 * @returns {string[]} - [before, after]
 */
function splitFirst(str, sep) {
  const index = str.indexOf(sep);
  if (index === -1) return [str, ''];
  return [str.slice(0, index), str.slice(index + 1)];
}

/**
 * Parse a YAML value into appropriate JavaScript type
 * @param {string} value - Raw value string
 * @returns {any} - Parsed value
 */
function parseValue(value) {
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }

  // Handle inline arrays [item1, item2]
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(',').map(v => parseValue(v.trim()));
  }

  // Handle inline objects {key: value}
  if (value.startsWith('{') && value.endsWith('}')) {
    const inner = value.slice(1, -1).trim();
    if (!inner) return {};
    const obj = {};
    // Simple parsing - doesn't handle nested objects
    const pairs = inner.split(',');
    for (const pair of pairs) {
      const [k, v] = splitFirst(pair.trim(), ':');
      if (k) {
        obj[k.trim()] = parseValue((v || '').trim());
      }
    }
    return obj;
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Null
  if (value === 'null' || value === '~') return null;

  // Number
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  if (/^-?\d*\.\d+$/.test(value)) {
    return parseFloat(value);
  }

  // String (default)
  return value;
}

/**
 * Stringify a JavaScript object to YAML
 * @param {Object} obj - Object to stringify
 * @param {number} indent - Current indentation level
 * @returns {string} - YAML string
 */
function stringifyYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  const lines = [];

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      lines.push(`${spaces}${key}: null`);
    } else if (typeof value === 'boolean') {
      lines.push(`${spaces}${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${spaces}${key}: ${value}`);
    } else if (typeof value === 'string') {
      // Check if needs quotes
      if (value.includes('\n')) {
        lines.push(`${spaces}${key}: |`);
        for (const line of value.split('\n')) {
          lines.push(`${spaces}  ${line}`);
        }
      } else if (value.includes(':') || value.includes('#') || !value) {
        lines.push(`${spaces}${key}: "${value}"`);
      } else {
        lines.push(`${spaces}${key}: ${value}`);
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${spaces}${key}: []`);
      } else if (value.every(v => typeof v !== 'object')) {
        // Simple array - inline
        const items = value.map(v =>
          typeof v === 'string' && (v.includes(',') || v.includes(':'))
            ? `"${v}"` : String(v)
        );
        lines.push(`${spaces}${key}: [${items.join(', ')}]`);
      } else {
        // Complex array
        lines.push(`${spaces}${key}:`);
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            const itemYaml = stringifyYaml(item, indent + 2);
            const itemLines = itemYaml.split('\n').filter(l => l.trim());
            if (itemLines.length > 0) {
              lines.push(`${spaces}  - ${itemLines[0].trim()}`);
              for (let i = 1; i < itemLines.length; i++) {
                lines.push(`${spaces}    ${itemLines[i].trim()}`);
              }
            }
          } else {
            lines.push(`${spaces}  - ${item}`);
          }
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${spaces}${key}:`);
      lines.push(stringifyYaml(value, indent + 1));
    }
  }

  return lines.join('\n');
}

module.exports = {
  parseYaml,
  stringifyYaml,
  parseValue
};
