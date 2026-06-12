# create-prompt

> Your daily prompt framework - organized AI prompts with smart auto-filling and context detection

## Features

- **Smart Prompt Creation**: Interactive prompt builder with context detection and auto-filling
- **One-Command Setup**: `p init` scaffolds everything and updates your `.gitignore`
- **Project Structure Generation**: Auto-generates project tree with customizable ignore patterns
- **Persona Templates**: Built-in AI personas (backend, frontend, linux, php, javascript)
- **Git Workflow Integration**: Structured commit tracking with file change documentation
- **Auto-detection**: Reads package.json to fill tools, versions, and environment
- **Context Files**: Load reusable context from `.create-prompt/context/` into every prompt

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
# Set up create-prompt in your project
p init

# Pick an AI persona (optional)
p persona javascript

# Create a new prompt
p

# Quick mode (minimal questions)
p --quick
```

---

## Commands

### Initialize a Project

```bash
p init
```

Sets up create-prompt in the current project:
1. Scaffolds `.create-prompt/` with `base_prompt.md`, `context/`, and `results/`
2. Adds `.create-prompt` to `.gitignore` (creates `.gitignore` if missing)
3. Generates the project structure (same as `p ps`)

### Create a Prompt

```bash
p              # Smart mode
p --quick      # Quick mode - minimal questions
p -q --no-history
```

Creates a prompt file in `.create-prompt/results/YYYYMMDD_NN_slug.md`, using `base_prompt.md` if present or assembling from context files.

### Generate Project Structure

```bash
p project-structure    # or: p ps
```

Generates `.create-prompt/context/project_structure.md` with your directory tree and rebuilds `base_prompt.md`.

**Custom ignore patterns** — Create `.create-prompt/ignore_files.txt`:
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

**Setup** — Create `.create-prompt/requested_files.txt`:
```txt
src/index.js
src/components/Header.jsx
README.md
```

### Use a Persona

```bash
p persona              # List available personas
p persona backend      # Install the backend persona
p persona php --force  # Replace an existing persona
```

Installs a built-in persona to `.create-prompt/context/persona.md` and rebuilds `base_prompt.md`. Available personas: `backend`, `frontend`, `linux`, `php`, `javascript`.

Without `--force`, an existing `persona.md` is never overwritten — so feel free to edit yours after installing.

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

## Context Files

Place Markdown files in `.create-prompt/context/` and they'll be included in every generated prompt:

```
.create-prompt/
├── context/
│   ├── persona.md        # AI persona definition
│   ├── standards.md      # Coding standards
│   └── instructions.md   # Behavior rules
├── base_prompt.md        # Base prompt template (auto-created)
└── results/              # Generated prompts
```

`p init` (or the first run of `p`) auto-creates `.create-prompt/base_prompt.md` with your project structure filled in.

---

## Quick Reference

| Command | Shortcut | Description |
|---------|----------|-------------|
| `p init` | - | Set up create-prompt in a project |
| `p` | - | Create a prompt |
| `p --quick` | `p -q` | Quick prompt creation |
| `p persona <name>` | - | Install a persona template |
| `p project-structure` | `p ps` | Generate project structure |
| `p files-markdown` | `p fm` | Generate markdown from file list |
| `p finish` | `p f` | Finish work with git commit |

---

## Programmatic API

```javascript
const { createCLI } = require('create-prompt');

const cli = createCLI();
await cli.run(process.argv.slice(2));
```

## License

MIT
