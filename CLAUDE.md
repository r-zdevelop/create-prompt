# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`create-prompt` is a CLI tool for creating organized AI prompts with smart auto-filling and context detection. It's a zero-dependency Node.js CLI.

## Commands

```bash
# Run CLI locally during development
node bin/create-prompt

# Test specific commands
node bin/create-prompt --help
node bin/create-prompt project-structure
node bin/create-prompt files-markdown
node bin/create-prompt finish
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
- `finishCommand.js` - Git commit workflow
- `generateStructure.js` - Project tree generation
- `generateFilesMarkdown.js` - File content aggregation

**Services** (`src/services/`):
- `contextService.js` - Parses `.create-prompt/context/*.md` files with YAML frontmatter
- `templateService.js` - Base prompt template handling
- `promptService.js` - Prompt file creation
- `projectService.js` - Project metadata detection
- `gitContextService.js` - Git state reading
- `relevanceService.js` - Context relevance scoring
- `taskTypeService.js` - Task type detection
- `requirementsService.js` - Task requirements inference
- `fileSuggestionService.js` - Relevant file suggestions

**Utilities** (`src/utils/`):
- `yamlParser.js` - Pure Node.js YAML parser (no dependencies)
- `input.js` - `InputCollector` class wrapping readline
- `gitignore.js` - Pattern matching for ignore files
- `tree.js` - Directory tree generation
- `slugify.js` - Filename slug generation

### Configuration

All constants in `src/config.js`:
- `PROMPT_DIR: '.create-prompt'` - Working directory for all commands
- `RELEVANCE.*` - Context relevance filtering settings
- `TASK_TYPES.*` - Task type detection settings
- `MESSAGES.*` - User-facing strings
- `ALWAYS_IGNORE` - Default ignore patterns

### Working Directory Structure

```
.create-prompt/
├── context/     ← Markdown context files with YAML frontmatter
├── base_prompt.md  ← Base prompt template (auto-created on first run)
└── results/     ← Generated prompt files
```

### Data Flow for `p` (createPrompt)

```
User Input → collectUserInput()
                    ↓
           contextService.loadContext()
                    ↓
           templateService.buildFromBasePrompt()
                    ↓
           createPromptFile() → .create-prompt/results/
```

## Conventions

- **No external dependencies** - Pure Node.js only
- **Async/await** throughout
- **camelCase** for files and functions
- All paths use `config.PROMPT_DIR` constant
- Commands export a single async function
- Services export multiple named functions
