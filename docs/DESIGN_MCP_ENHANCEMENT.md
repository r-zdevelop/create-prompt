# MCP Context-Aware Prompt Generator - Design Document

## Overview

This document describes the design for enhancing `create-prompt` with a new **MCP Context System** that enables automatic context loading, schema-based variable injection, and intelligent prompt generation from casual user intents.

---

## 1. Architecture Overview

### 1.1 New Directory Structure

```
.mcp/                           ← MCP context root
├── prompts/                    ← Prompt templates (JSON)
│   ├── base.json              ← Base/default prompt template
│   ├── ui.json                ← UI-specific template
│   ├── workflow.json          ← Workflow-specific template
│   └── api.json               ← API-related template
├── context/                    ← Project context documents (Markdown)
│   ├── project.md             ← Project overview
│   ├── commit_history.md      ← Recent commits/changes
│   ├── architecture.md        ← Architecture decisions
│   └── conventions.md         ← Coding conventions
├── schemas/                    ← Variable schemas (JSON/YAML)
│   ├── colors.yaml            ← Color palette definitions
│   ├── specs.json             ← UI specifications
│   └── api.json               ← API endpoint specs
└── config.json                 ← MCP configuration (optional)
```

### 1.2 Module Architecture

Following the existing layered architecture:

```
src/
├── commands/
│   ├── enhance.js             ← NEW: Main enhance command
│   └── mcpInit.js             ← NEW: Initialize .mcp structure
├── services/
│   ├── mcpService.js          ← NEW: MCP orchestration service
│   ├── contextService.js      ← NEW: Context file loader
│   ├── schemaService.js       ← NEW: Schema parser/validator
│   └── intentService.js       ← NEW: Intent-to-prompt transformer
├── utils/
│   ├── yamlParser.js          ← NEW: YAML parsing utility
│   └── promptBuilder.js       ← NEW: Prompt assembly utility
└── templates/
    └── mcp/                    ← NEW: Default MCP templates
        ├── base.json
        ├── project.md
        └── config.json
```

### 1.3 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Intent                              │
│    "create a signup button with color palette X, API signup"     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IntentService                               │
│  • Parse intent keywords                                         │
│  • Match relevant templates                                      │
│  • Identify required variables                                   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ ContextService  │  │ SchemaService   │  │ TemplateLoader  │
│ Load .md files  │  │ Parse schemas   │  │ Load .json      │
│ Project context │  │ Resolve vars    │  │ templates       │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PromptBuilder                               │
│  • Merge template + context + variables                          │
│  • Optimize for target LLM                                       │
│  • Validate completeness                                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Generated Prompt                            │
│  Fully contextualized, schema-filled, optimized prompt           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Specifications

### 2.1 MCP Service (`src/services/mcpService.js`)

**Responsibility**: Orchestrate all MCP operations, coordinate services.

```javascript
// Exports
module.exports = {
  loadMcpContext,      // Load all context from .mcp directory
  generatePrompt,      // Main prompt generation function
  validateMcpStructure // Validate .mcp directory structure
};

// Core Functions
async function loadMcpContext(mcpRoot = '.mcp') {
  // Returns: { prompts, context, schemas, config }
}

async function generatePrompt(intent, options = {}) {
  // options: { template, target, variables, includeContext }
  // Returns: { prompt, metadata, warnings }
}

function validateMcpStructure(mcpRoot = '.mcp') {
  // Returns: { valid, errors, warnings }
}
```

### 2.2 Context Service (`src/services/contextService.js`)

**Responsibility**: Load and parse context files from `.mcp/context`.

```javascript
// Exports
module.exports = {
  loadContext,         // Load all context files
  loadContextFile,     // Load single context file
  parseContextMeta,    // Extract frontmatter metadata
  selectRelevantContext // Filter context by relevance
};

// Context File Format (Markdown with optional YAML frontmatter)
/*
---
type: architecture
priority: high
tags: [api, backend, auth]
---

# Architecture Overview

Our system uses a microservices architecture...
*/
```

### 2.3 Schema Service (`src/services/schemaService.js`)

**Responsibility**: Parse schemas, validate variables, resolve values.

```javascript
// Exports
module.exports = {
  loadSchemas,         // Load all schema files
  loadSchema,          // Load single schema
  resolveVariable,     // Get variable value from schema
  validateSchema,      // Validate schema format
  extractVariables     // Extract variables from template
};

// Schema Format (JSON)
{
  "name": "colors",
  "version": "1.0",
  "variables": {
    "primary": {
      "type": "color",
      "value": "#3B82F6",
      "description": "Primary brand color"
    },
    "secondary": {
      "type": "color",
      "value": "#10B981",
      "description": "Secondary accent color"
    }
  }
}

// Schema Format (YAML)
name: colors
version: "1.0"
variables:
  primary:
    type: color
    value: "#3B82F6"
    description: Primary brand color
  secondary:
    type: color
    value: "#10B981"
    description: Secondary accent color
```

### 2.4 Intent Service (`src/services/intentService.js`)

**Responsibility**: Parse casual user intent into structured requirements.

```javascript
// Exports
module.exports = {
  parseIntent,         // Parse intent into components
  matchTemplates,      // Find relevant templates
  extractRequirements, // Extract explicit requirements
  inferContext         // Infer context needs from keywords
};

// Parsed Intent Structure
{
  raw: "create a signup button with color palette X, API signup",
  action: "create",
  components: ["button", "signup"],
  references: {
    schemas: ["colors.X"],
    context: ["api"]
  },
  keywords: ["signup", "button", "color", "api"],
  requirements: [
    { type: "ui", description: "signup button" },
    { type: "api", description: "signup endpoint" }
  ]
}
```

### 2.5 Prompt Builder (`src/utils/promptBuilder.js`)

**Responsibility**: Assemble final prompt from components.

```javascript
// Exports
module.exports = {
  buildPrompt,         // Assemble complete prompt
  applyVariables,      // Replace variable placeholders
  optimizeForTarget,   // Optimize for specific LLM
  formatOutput         // Format final output
};

// Build Options
{
  template: "ui",           // Template to use
  target: "claude",         // Target LLM (claude, cursor, gpt, etc.)
  format: "markdown",       // Output format
  includeContext: true,     // Include project context
  maxTokens: null,          // Token limit (optional)
  sections: {               // Section toggles
    context: true,
    requirements: true,
    constraints: true,
    examples: true
  }
}
```

---

## 3. Prompt Template Format

### 3.1 Template JSON Structure

```json
{
  "$schema": "https://create-prompt.dev/schemas/template.json",
  "name": "ui",
  "version": "1.0",
  "description": "Template for UI component generation",
  "extends": "base",
  "
  "tags": ["ui", "frontend", "component"],

  "variables": {
    "component_name": {
      "required": true,
      "description": "Name of the component to create"
    },
    "framework": {
      "default": "react",
      "enum": ["react", "vue", "svelte", "vanilla"]
    }
  },

  "context": {
    "auto": ["architecture", "conventions"],
    "optional": ["project"]
  },

  "sections": {
    "header": {
      "content": "# {{component_name}} Implementation",
      "priority": 1
    },
    "context": {
      "template": "## Project Context\n\n{{context.project}}\n\n{{context.architecture}}",
      "priority": 2,
      "conditional": "includeContext"
    },
    "requirements": {
      "template": "## Requirements\n\n{{intent.requirements}}",
      "priority": 3
    },
    "constraints": {
      "template": "## Constraints\n\n- Use {{schema.colors.primary}} as primary color\n- Follow existing {{context.conventions}}",
      "priority": 4
    },
    "output": {
      "template": "## Expected Output\n\nProvide complete, production-ready code for the {{component_name}}.",
      "priority": 5
    }
  },

  "optimization": {
    "claude": {
      "systemPrompt": "You are an expert {{framework}} developer.",
      "prefill": null
    },
    "cursor": {
      "fileContext": true,
      "projectAware": true
    }
  }
}
```

### 3.2 Variable Interpolation Syntax

```
{{variable}}              → Simple variable
{{schema.colors.primary}} → Schema reference
{{context.project}}       → Context file reference
{{intent.requirements}}   → Parsed intent data
{{?optional}}             → Optional (omit if missing)
{{#each items}}...{{/each}} → Iteration
{{#if condition}}...{{/if}} → Conditional
```

---

## 4. CLI Commands & Flags

### 4.1 New Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `create-prompt enhance` | `e` | Generate contextualized prompt from intent |
| `create-prompt mcp-init` | `mi` | Initialize .mcp directory structure |
| `create-prompt mcp-validate` | `mv` | Validate .mcp configuration |
| `create-prompt mcp-list` | `ml` | List available templates/schemas |

### 4.2 Command: `enhance`

```bash
# Basic usage
create-prompt enhance "create a signup button with blue palette"

# With explicit template
create-prompt enhance "add user auth" --template workflow

# Target specific LLM
create-prompt enhance "build API endpoint" --target cursor

# Output to file
create-prompt enhance "create form" --output generated_prompt.md

# Interactive mode (prompts for missing info)
create-prompt enhance --interactive

# Dry run (show what would be generated)
create-prompt enhance "create button" --dry-run

# Include specific context
create-prompt enhance "add feature" --context project,architecture

# Exclude context
create-prompt enhance "simple task" --no-context

# Use specific schema variables
create-prompt enhance "style component" --vars "colors.primary=#FF0000"

# Verbose output
create-prompt enhance "task" --verbose
```

**Flags:**

| Flag | Short | Type | Default | Description |
|------|-------|------|---------|-------------|
| `--template` | `-t` | string | auto | Template to use |
| `--target` | `-T` | string | claude | Target LLM |
| `--output` | `-o` | string | stdout | Output file |
| `--interactive` | `-i` | boolean | false | Interactive mode |
| `--dry-run` | `-d` | boolean | false | Preview without generating |
| `--context` | `-c` | string[] | all | Context files to include |
| `--no-context` | - | boolean | false | Exclude all context |
| `--vars` | `-v` | string[] | [] | Override variables |
| `--verbose` | `-V` | boolean | false | Verbose output |
| `--format` | `-f` | string | markdown | Output format |
| `--copy` | - | boolean | false | Copy to clipboard |

### 4.3 Command: `mcp-init`

```bash
# Initialize with defaults
create-prompt mcp-init

# Initialize with specific templates
create-prompt mcp-init --templates ui,api,workflow

# Initialize from existing project analysis
create-prompt mcp-init --analyze

# Force overwrite existing
create-prompt mcp-init --force
```

### 4.4 Command: `mcp-validate`

```bash
# Validate all
create-prompt mcp-validate

# Validate specific component
create-prompt mcp-validate --schemas
create-prompt mcp-validate --templates
create-prompt mcp-validate --context

# Fix common issues automatically
create-prompt mcp-validate --fix
```

### 4.5 Command: `mcp-list`

```bash
# List all
create-prompt mcp-list

# List specific type
create-prompt mcp-list templates
create-prompt mcp-list schemas
create-prompt mcp-list context

# Show details
create-prompt mcp-list templates --verbose
```

---

## 5. Programmatic API

### 5.1 Module Exports

```javascript
// src/index.js - Updated exports
module.exports = {
  // Existing
  createCLI,
  config,

  // New MCP exports
  mcp: {
    loadContext,
    generatePrompt,
    validateStructure,
    parseIntent,
    buildPrompt
  }
};
```

### 5.2 Usage Examples

```javascript
const { mcp } = require('create-prompt');

// Basic usage
const prompt = await mcp.generatePrompt(
  "create a signup form with validation",
  { template: "ui", target: "claude" }
);
console.log(prompt.content);

// Advanced usage with custom context
const context = await mcp.loadContext('.mcp');
const parsed = mcp.parseIntent("add user authentication");
const result = mcp.buildPrompt({
  intent: parsed,
  template: context.prompts.workflow,
  schemas: context.schemas,
  context: context.context,
  target: "cursor"
});

// Validation
const validation = mcp.validateStructure('.mcp');
if (!validation.valid) {
  console.error('MCP validation failed:', validation.errors);
}
```

---

## 6. Error Handling

### 6.1 Error Types

```javascript
// src/errors/mcpErrors.js

class McpError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.details = details;
  }
}

// Specific error types
class ContextNotFoundError extends McpError { code = 'CONTEXT_NOT_FOUND' }
class SchemaValidationError extends McpError { code = 'SCHEMA_INVALID' }
class TemplateParseError extends McpError { code = 'TEMPLATE_PARSE_ERROR' }
class VariableResolutionError extends McpError { code = 'VAR_RESOLUTION_ERROR' }
class IntentParseError extends McpError { code = 'INTENT_PARSE_ERROR' }
```

### 6.2 Error Handling Strategy

| Scenario | Behavior | User Message |
|----------|----------|--------------|
| `.mcp` directory missing | Prompt to run `mcp-init` | "MCP not initialized. Run `create-prompt mcp-init` first." |
| Context file missing | Warning, continue | "Warning: context/project.md not found, skipping." |
| Schema parse error | Error with details | "Schema error in colors.yaml: Invalid YAML at line 5" |
| Template not found | Fallback to base | "Template 'custom' not found, using 'base'" |
| Variable unresolved | Warning, leave placeholder | "Warning: {{schema.unknown}} could not be resolved" |
| Invalid intent | Interactive prompt | "Could not parse intent. Please specify: [options]" |

### 6.3 Validation Rules

```javascript
// Schema validation rules
const schemaValidation = {
  required: ['name', 'variables'],
  variableRequired: ['type'],
  supportedTypes: ['string', 'number', 'color', 'boolean', 'array', 'object'],
  maxFileSize: 1024 * 1024 // 1MB
};

// Template validation rules
const templateValidation = {
  required: ['name', 'sections'],
  sectionRequired: ['content OR template'],
  maxSections: 20,
  supportedTargets: ['claude', 'cursor', 'gpt', 'antigravity', 'generic']
};

// Context validation rules
const contextValidation = {
  supportedFormats: ['.md', '.txt'],
  maxFileSize: 512 * 1024, // 512KB
  frontmatterOptional: true
};
```

---

## 7. Configuration

### 7.1 MCP Config File (`.mcp/config.json`)

```json
{
  "$schema": "https://create-prompt.dev/schemas/config.json",
  "version": "1.0",

  "defaults": {
    "template": "base",
    "target": "claude",
    "includeContext": true,
    "format": "markdown"
  },

  "context": {
    "autoLoad": ["project", "architecture"],
    "exclude": ["drafts/*"]
  },

  "schemas": {
    "autoResolve": true,
    "strictValidation": false
  },

  "templates": {
    "extends": {
      "ui": "base",
      "api": "base",
      "workflow": "base"
    }
  },

  "optimization": {
    "claude": {
      "maxContextTokens": 8000,
      "includeSystemPrompt": true
    },
    "cursor": {
      "fileContext": true,
      "maxFiles": 10
    }
  },

  "output": {
    "directory": ".prompts",
    "filenamePattern": "{{date}}_{{template}}_{{slug}}.md"
  }
}
```

### 7.2 Global Config (`src/config.js` additions)

```javascript
// Add to existing config.js
const MCP_CONFIG = {
  MCP_DIR: '.mcp',
  PROMPTS_SUBDIR: 'prompts',
  CONTEXT_SUBDIR: 'context',
  SCHEMAS_SUBDIR: 'schemas',
  CONFIG_FILE: 'config.json',

  DEFAULT_TEMPLATE: 'base',
  DEFAULT_TARGET: 'claude',

  SUPPORTED_SCHEMA_FORMATS: ['.json', '.yaml', '.yml'],
  SUPPORTED_CONTEXT_FORMATS: ['.md', '.txt'],
  SUPPORTED_TEMPLATE_FORMAT: '.json',

  TARGETS: {
    claude: { name: 'Claude', maxTokens: 200000 },
    cursor: { name: 'Cursor', maxTokens: 128000 },
    gpt: { name: 'GPT-4', maxTokens: 128000 },
    antigravity: { name: 'Antigravity', maxTokens: 100000 },
    generic: { name: 'Generic', maxTokens: null }
  },

  MESSAGES: {
    MCP_NOT_INITIALIZED: 'MCP not initialized. Run `create-prompt mcp-init` first.',
    TEMPLATE_NOT_FOUND: 'Template "{name}" not found, using "base".',
    SCHEMA_ERROR: 'Schema error in {file}: {error}',
    CONTEXT_NOT_FOUND: 'Context file "{file}" not found, skipping.',
    PROMPT_GENERATED: 'Prompt generated successfully!',
    VALIDATION_FAILED: 'Validation failed with {count} error(s).'
  }
};

module.exports = { ...existingConfig, MCP: MCP_CONFIG };
```

---

## 8. Integration with Existing Architecture

### 8.1 Backward Compatibility

- All existing commands remain unchanged
- `.prompts` directory still functions as before
- New `.mcp` directory is independent
- `create-prompt` (default command) still creates simple prompts

### 8.2 Cross-Feature Integration

```javascript
// Enhance can use existing project structure
const { getProjectStructureString } = require('./utils/tree');
const structure = await getProjectStructureString();

// Enhance can use auto-context
const { getAutoContext } = require('./services/projectService');
const autoContext = getAutoContext();

// Generated prompts can be saved to .prompts
const { createPromptFile } = require('./services/promptService');
await createPromptFile(generatedPrompt, '.prompts');
```

### 8.3 CLI Router Integration

```javascript
// src/cli.js - Updated parseArguments
function parseArguments(args) {
  return {
    // Existing flags...

    // New MCP flags
    enhance: args.includes('enhance') || args.includes('e'),
    mcpInit: args.includes('mcp-init') || args.includes('mi'),
    mcpValidate: args.includes('mcp-validate') || args.includes('mv'),
    mcpList: args.includes('mcp-list') || args.includes('ml'),

    // Enhance flags
    template: extractFlagValue(args, '--template', '-t'),
    target: extractFlagValue(args, '--target', '-T'),
    output: extractFlagValue(args, '--output', '-o'),
    interactive: args.includes('--interactive') || args.includes('-i'),
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    noContext: args.includes('--no-context'),
    verbose: args.includes('--verbose') || args.includes('-V'),
    copy: args.includes('--copy'),

    // Intent (remaining args after command)
    intent: extractIntent(args)
  };
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```
tests/
├── services/
│   ├── mcpService.test.js
│   ├── contextService.test.js
│   ├── schemaService.test.js
│   └── intentService.test.js
├── utils/
│   ├── promptBuilder.test.js
│   └── yamlParser.test.js
├── commands/
│   ├── enhance.test.js
│   └── mcpInit.test.js
└── fixtures/
    └── mcp/
        ├── prompts/
        ├── context/
        └── schemas/
```

### 9.2 Test Cases

| Component | Test Case |
|-----------|-----------|
| ContextService | Load valid markdown, handle missing files, parse frontmatter |
| SchemaService | Parse JSON, parse YAML, validate schema, resolve nested vars |
| IntentService | Parse simple intent, extract keywords, match templates |
| PromptBuilder | Variable interpolation, conditional sections, target optimization |
| EnhanceCommand | Full workflow, error handling, output options |

---

## 10. Implementation Phases

### Phase 1: Foundation (Core Infrastructure)
1. Create directory structure
2. Implement YAML parser utility
3. Implement schema service
4. Implement context service
5. Add configuration constants

### Phase 2: Intent Processing
1. Implement intent service
2. Add keyword matching
3. Add template matching
4. Implement requirement extraction

### Phase 3: Prompt Generation
1. Implement prompt builder
2. Add variable interpolation
3. Add conditional sections
4. Add target optimization

### Phase 4: CLI Integration
1. Implement `mcp-init` command
2. Implement `enhance` command
3. Implement `mcp-validate` command
4. Implement `mcp-list` command
5. Update help text

### Phase 5: Polish & Documentation
1. Add comprehensive error handling
2. Add verbose logging
3. Create default templates
4. Write user documentation

---

## 11. Default Templates

### 11.1 Base Template (`templates/mcp/prompts/base.json`)

```json
{
  "name": "base",
  "version": "1.0",
  "description": "Base template for all prompts",
  "sections": {
    "header": {
      "template": "# Task: {{intent.action}} {{intent.subject}}",
      "priority": 1
    },
    "context": {
      "template": "## Context\n\n{{#each context}}### {{name}}\n{{content}}\n\n{{/each}}",
      "priority": 2,
      "conditional": "includeContext"
    },
    "requirements": {
      "template": "## Requirements\n\n{{#each intent.requirements}}- {{description}}\n{{/each}}",
      "priority": 3
    },
    "output": {
      "template": "## Expected Output\n\nProvide a complete, working implementation.",
      "priority": 4
    }
  }
}
```

### 11.2 UI Template (`templates/mcp/prompts/ui.json`)

```json
{
  "name": "ui",
  "version": "1.0",
  "description": "Template for UI component generation",
  "extends": "base",
  "tags": ["ui", "frontend", "component"],
  "variables": {
    "framework": { "default": "react" },
    "styling": { "default": "tailwind" }
  },
  "sections": {
    "design": {
      "template": "## Design Specifications\n\n{{#if schema.colors}}- Primary: {{schema.colors.primary}}\n- Secondary: {{schema.colors.secondary}}{{/if}}\n{{#if schema.specs}}\n### UI Specs\n{{schema.specs}}{{/if}}",
      "priority": 2.5
    },
    "constraints": {
      "template": "## Technical Constraints\n\n- Framework: {{framework}}\n- Styling: {{styling}}\n- Must be accessible (WCAG 2.1)\n- Must be responsive",
      "priority": 3.5
    }
  }
}
```

### 11.3 Default Context (`templates/mcp/context/project.md`)

```markdown
---
type: project
priority: high
tags: [overview]
---

# Project Overview

[Describe your project here]

## Tech Stack

- Frontend: [Framework]
- Backend: [Framework]
- Database: [Database]

## Key Features

- Feature 1
- Feature 2

## Conventions

- [List coding conventions]
```

---

## 12. Success Criteria

1. **Functionality**: All commands work as specified
2. **Compatibility**: No breaking changes to existing features
3. **Performance**: Prompt generation < 500ms for typical use
4. **Usability**: Clear error messages and help text
5. **Maintainability**: Follows existing code patterns
6. **Testability**: All services have unit tests
7. **Documentation**: Complete user documentation

---

## Appendix A: File Format Examples

### A.1 Complete Schema Example (`schemas/colors.yaml`)

```yaml
name: colors
version: "1.0"
description: Brand color palette
variables:
  primary:
    type: color
    value: "#3B82F6"
    description: Primary brand color (blue)
  secondary:
    type: color
    value: "#10B981"
    description: Secondary accent (green)
  accent:
    type: color
    value: "#F59E0B"
    description: Accent/warning color (amber)
  background:
    type: color
    value: "#F3F4F6"
    description: Background color
  text:
    type: color
    value: "#1F2937"
    description: Main text color
  error:
    type: color
    value: "#EF4444"
    description: Error state color
  success:
    type: color
    value: "#22C55E"
    description: Success state color
palettes:
  dark:
    primary: "#60A5FA"
    background: "#1F2937"
    text: "#F9FAFB"
  light:
    primary: "#3B82F6"
    background: "#FFFFFF"
    text: "#1F2937"
```

### A.2 Complete Context Example (`context/architecture.md`)

```markdown
---
type: architecture
priority: high
tags: [system, design]
updated: 2024-01-15
---

# System Architecture

## Overview

Our application follows a modular monolith architecture with clear domain boundaries.

## Layers

### Presentation Layer
- React 18 with TypeScript
- Tailwind CSS for styling
- React Query for server state

### Application Layer
- Express.js REST API
- Input validation with Zod
- JWT authentication

### Domain Layer
- Domain entities in /src/domain
- Business logic in services
- Repository pattern for data access

### Infrastructure Layer
- PostgreSQL database
- Redis for caching
- S3 for file storage

## Key Patterns

1. **Repository Pattern**: All data access through repositories
2. **Service Layer**: Business logic encapsulated in services
3. **DTO Pattern**: Data transfer objects for API boundaries
4. **Event-Driven**: Domain events for cross-module communication

## API Conventions

- RESTful endpoints
- Consistent error responses
- Pagination via cursor-based pagination
- Rate limiting on all endpoints
```

### A.3 Generated Prompt Example

Given intent: "create a signup button with primary color from palette"

```markdown
# Task: Create Signup Button Component

## Context

### Project Overview
Our application follows a modular monolith architecture with clear domain boundaries.
Tech Stack: React 18, TypeScript, Tailwind CSS

### Architecture
- Frontend: React 18 with TypeScript, Tailwind CSS
- State Management: React Query for server state

## Design Specifications

- Primary Color: #3B82F6
- Text on Primary: #FFFFFF
- Border Radius: 8px (from UI specs)

## Requirements

- Create a signup button component
- Use primary color from the color palette
- Button should trigger signup flow

## Technical Constraints

- Framework: React
- Styling: Tailwind CSS
- Must be accessible (WCAG 2.1)
- Must be responsive
- Follow existing component patterns

## Expected Output

Provide a complete, production-ready React component with:
1. TypeScript types
2. Tailwind CSS styling
3. Proper accessibility attributes
4. Loading and disabled states
5. Click handler prop for signup action
```

---

*Document Version: 1.0*
*Last Updated: 2024-01-24*
