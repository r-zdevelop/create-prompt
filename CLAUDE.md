# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`create-prompt` is a CLI tool for creating organized AI prompts with smart auto-filling, context detection, and MCP (Model Context Protocol) support. It's a zero-dependency Node.js CLI.

## Commands

```bash
# Run CLI locally during development
node bin/create-prompt

# Test specific commands
node bin/create-prompt --help
node bin/create-prompt init
node bin/create-prompt enhance "your intent"
node bin/create-prompt project-structure
```

No build step required - pure Node.js with CommonJS modules.

## Architecture

### Layered Structure

```
CLI Layer (src/cli.js)
    ↓ routes commands
Commands (src/commands/*.js)
    ↓ orchestrate
Services (src/services/*.js)
    ↓ use
Utilities (src/utils/*.js)
```

### Key Modules

**CLI Entry**: `bin/create-prompt` → `src/cli.js` → `createCLI().run(args)`

**Commands** (`src/commands/`):
- `createPrompt.js` - Interactive prompt creation
- `enhance.js` - MCP-powered contextualized prompt generation
- `mcpInit.js` - Initialize `.create-prompt` directory from templates
- `finishCommand.js` - Git commit workflow
- `generateStructure.js` - Project tree generation
- `generateFilesMarkdown.js` - File content aggregation

**Services** (`src/services/`):
- `mcpService.js` - MCP orchestration (loads context, schemas, templates)
- `contextService.js` - Parses `.create-prompt/context/*.md` files with YAML frontmatter
- `schemaService.js` - Parses JSON/YAML schemas, resolves variables
- `intentService.js` - Parses casual user intents into structured requirements
- `templateService.js` - Base prompt template handling
- `promptService.js` - Prompt file creation

**Utilities** (`src/utils/`):
- `promptBuilder.js` - Assembles prompts from components
- `yamlParser.js` - Pure Node.js YAML parser (no dependencies)
- `input.js` - `InputCollector` class wrapping readline
- `gitignore.js` - Pattern matching for ignore files
- `tree.js` - Directory tree generation

### Configuration

All constants in `src/config.js`:
- `PROMPT_DIR: '.create-prompt'` - Working directory for all commands
- `MCP.*` - MCP-specific configuration
- `MESSAGES.*` - User-facing strings
- `ALWAYS_IGNORE` - Default ignore patterns

### MCP Context System

The `.create-prompt` directory structure:
```
.create-prompt/
├── prompts/     ← JSON prompt templates
├── context/     ← Markdown context files with YAML frontmatter
├── schemas/     ← JSON/YAML variable definitions
└── config.json  ← MCP configuration
```

Bundled templates are in `templates/create-prompt/` and copied during `init`.

### Data Flow for `enhance` Command

```
User Intent → intentService.parseIntent()
                    ↓
           mcpService.loadMcpContext()
                    ↓
           contextService + schemaService
                    ↓
           promptBuilder.buildPrompt()
                    ↓
           Generated Prompt
```

## Conventions

- **No external dependencies** - Pure Node.js only
- **Async/await** throughout
- **camelCase** for files and functions
- All paths use `config.PROMPT_DIR` constant
- Commands export a single async function
- Services export multiple named functions
