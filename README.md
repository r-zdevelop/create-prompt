# create-prompt

> Your daily prompt framework - organized AI prompts with smart auto-filling, context detection, and MCP support

## Features

- **MCP Context System**: Define personas, standards, schemas, and project context for AI-optimized prompts
- **Enhance Command**: Generate contextualized prompts from casual intents
- **Multi-LLM Support**: Optimize prompts for Claude, Cursor, GPT, and more
- **Project Structure Generation**: Auto-generates project tree with customizable ignore patterns
- **Git Workflow Integration**: Structured commit tracking with file change documentation
- **Auto-detection**: Reads package.json to fill tools, versions, and environment

## Installation

```bash
npm install -g create-prompt
```

Or use the short alias:

```bash
p
```

## Quick Start

```bash
# 1. Initialize the MCP context system
p init

# 2. Edit your context files
#    .create-prompt/context/persona.md      - Define your AI persona
#    .create-prompt/context/standards.md    - Your coding standards
#    .create-prompt/context/instructions.md - Behavior rules

# 3. Generate contextual prompts
p e "create a login form with validation"
```

---

## MCP Context System

The MCP (Model Context Protocol) system lets you define reusable context for generating optimized prompts.

### Initialize MCP

```bash
p init    # or: p mi
```

Creates the `.create-prompt` directory structure:

```
.create-prompt/
├── prompts/              # Prompt templates (JSON)
│   ├── base.json
│   ├── ui.json
│   └── api.json
├── context/              # Project context (Markdown)
│   ├── persona.md        # AI persona definition
│   ├── standards.md      # Coding standards
│   ├── instructions.md   # Behavior rules
│   ├── project_structure.md
│   ├── history.md
│   └── latest_commit.md
├── schemas/              # Variable schemas (JSON/YAML)
│   └── colors.yaml
└── config.json           # MCP configuration
```

### Generate Contextual Prompts

```bash
p enhance "create a signup button with primary color"
# or
p e "add user authentication API"
```

The `enhance` command:
1. Parses your casual intent
2. Loads relevant context from `.create-prompt/context/`
3. Resolves variables from `.create-prompt/schemas/`
4. Selects appropriate template from `.create-prompt/prompts/`
5. Generates an optimized, contextualized prompt

**Options:**

| Flag | Short | Description |
|------|-------|-------------|
| `--template` | `-t` | Use specific template (ui, api, base) |
| `--target` | `-T` | Target LLM (claude, cursor, gpt) |
| `--output` | `-o` | Save to file |
| `--interactive` | `-i` | Interactive mode |
| `--dry-run` | `-d` | Preview without generating |
| `--no-context` | - | Exclude context files |
| `--verbose` | `-V` | Show detailed output |
| `--copy` | - | Copy to clipboard |

**Examples:**
```bash
p e "create modal component" --template ui
p e "add REST endpoint" --template api --target cursor
p e "refactor auth service" --output prompt.md --verbose
```

### Validate & List MCP Resources

```bash
p mcp-validate    # or: p mv - Check for errors
p mcp-list        # or: p ml - List all resources
p ml templates    # List only templates
p ml schemas -v   # List schemas with details
```

---

## Project Commands

### Generate Project Structure

```bash
p project-structure    # or: p ps
```

Generates `.create-prompt/project_structure.md` with your directory tree.

**Custom ignore patterns** - Create `.create-prompt/ignore_files.txt`:
```txt
public/images
public/css
*.log
dist/
```

### Generate Files Markdown

```bash
p files-markdown    # or: p fm
```

Aggregates file contents into `.create-prompt/requested_files.md`.

**Setup** - Create `.create-prompt/requested_files.txt`:
```txt
src/index.js
src/components/Header.jsx
README.md
```

---

## Git Workflow

### Finish Your Work

```bash
p finish    # or: p f
```

Complete your work session:
1. Describe what you did
2. Review git status
3. Add file-by-file descriptions (optional)
4. Performs git commit

---

## Legacy Prompt Creation

For quick, standalone prompts without MCP context:

```bash
p              # Smart mode - asks for tags, task
p --quick      # Quick mode - minimal questions
p -q --no-history
```

Creates individual prompt files: `.create-prompt/YYYYMMDD_NN_slug.md`

---

## Quick Reference

| Command | Shortcut | Description |
|---------|----------|-------------|
| `p init` | `p mi` | Initialize MCP context system |
| `p enhance <intent>` | `p e` | Generate contextual prompt |
| `p mcp-validate` | `p mv` | Validate MCP configuration |
| `p mcp-list` | `p ml` | List MCP resources |
| `p project-structure` | `p ps` | Generate project structure |
| `p files-markdown` | `p fm` | Generate markdown from file list |
| `p finish` | `p f` | Finish work with git commit |
| `p` | - | Create standalone prompt |
| `p --quick` | `p -q` | Quick prompt creation |

---

## Workflow Example

```bash
# Initial setup (once per project)
p init                            # Initialize MCP
# Edit .create-prompt/context/persona.md with your AI persona
# Edit .create-prompt/context/standards.md with your standards

# Daily workflow
p ps                              # Update project structure
p e "implement user dashboard"    # Generate contextual prompt

# ... do your work ...

p f                               # Finish and commit
```

---

## Programmatic API

```javascript
const { mcp } = require('create-prompt');

const result = await mcp.generatePrompt(
  "create a signup form",
  { template: "ui", target: "claude" }
);

console.log(result.prompt);
```

## License

MIT
