# create-prompt

> Your daily prompt framework - organized AI prompts with smart auto-filling and context detection

## Features

- **Smart Prompt Creation**: Interactive prompt builder with context detection and auto-filling
- **One-Command Setup**: `p init` scaffolds everything and updates your `.gitignore`
- **Project Structure Generation**: Auto-generates project tree with customizable ignore patterns
- **Persona Templates**: Built-in AI personas (backend, frontend, linux, php, javascript)
- **Git Workflow Integration**: Structured commit tracking with file change documentation
- **Auto-detection**: Reads package.json to fill project info, versions, and environment
- **File Request Workflow**: Prompts instruct the AI to request file contents in a format ready for `p fm`
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
2. Detects project metadata (name, stack, scripts) into `context/project_info.md`
3. Installs `context/instructions.md` — tells the AI to request relevant files in a format ready for `p fm`
4. Creates `requested_files.txt` and `ignore_files.txt` so `p fm` and `p ps` work out of the box
5. Adds `.create-prompt` to `.gitignore` (creates `.gitignore` if missing)
6. Generates the project structure and git activity (same as `p ps`)

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

Generates `.create-prompt/context/project_structure.md` with your directory tree, refreshes `context/recent_activity.md` (current branch + latest commits), and rebuilds `base_prompt.md`. Any `## History` entries in `base_prompt.md` are preserved across rebuilds.

**Custom ignore patterns** — Edit `.create-prompt/ignore_files.txt` (created with sensible defaults like `dist/`, `coverage/`, `*.log`):
```txt
public/images
public/css
*.old
.env*
```

### Generate Files Markdown

```bash
p files-markdown    # or: p fm
```

Aggregates file contents into `.create-prompt/requested_files.md`.

Generated prompts instruct the AI to reply with a plain list of file paths — paste that list into `requested_files.txt`, run `p fm`, and share the output.

**Setup** — Edit `.create-prompt/requested_files.txt` (created by `p init`):
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

## Typical Workflow

1. `p init` — set up the project (once)
2. `p persona javascript` — pick a persona (optional)
3. `p` — describe your task, get a complete prompt in `results/`
4. Paste the prompt into your AI — it replies with the list of files it needs
5. Paste that list into `.create-prompt/requested_files.txt` and run `p fm`
6. Share `requested_files.md` with the AI — it completes the task with full context

---

## Context Files

Markdown files in `.create-prompt/context/` are merged into `base_prompt.md`, ordered by their `priority` frontmatter (`high` → `medium` → `low`):

```
.create-prompt/
├── context/
│   ├── persona.md             # AI persona (installed via `p persona`)
│   ├── project_info.md        # Detected project metadata (created by `p init`)
│   ├── project_structure.md   # Directory tree (refreshed by `p ps`)
│   ├── recent_activity.md     # Git branch + latest commits (refreshed by `p ps`)
│   └── instructions.md        # File request workflow rules (created by `p init`)
├── base_prompt.md             # Assembled prompt template
├── ignore_files.txt           # Patterns excluded from the structure tree
├── requested_files.txt        # File list consumed by `p fm`
└── results/                   # Generated prompts
```

Add your own files (e.g. `standards.md`) with YAML frontmatter:

```markdown
---
type: standards
priority: high
tags: [style, conventions]
---

# Coding Standards
...
```

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
