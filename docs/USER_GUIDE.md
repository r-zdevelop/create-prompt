# Create-Prompt User Guide

A complete guide to generating smart, contextualized prompts for AI assistants.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Initial Setup](#initial-setup)
3. [Daily Workflow](#daily-workflow)
4. [Understanding Smart Features](#understanding-smart-features)
5. [Customizing Your Context](#customizing-your-context)
6. [Configuration Options](#configuration-options)
7. [Tips & Best Practices](#tips--best-practices)

---

## Quick Start

**Before (manual copy-paste):**
```
You copy your base prompt template...
Manually add project structure...
Paste recent commits...
Add your task at the end...
Send to Claude/GPT...
```

**After (with create-prompt):**
```bash
# One command generates everything
node bin/create-prompt enhance "Add Open Graph meta tags"

# Output saved and copied to clipboard - just paste into chat!
```

---

## Initial Setup

### Step 1: Navigate to your project

```bash
cd /path/to/your/project
```

### Step 2: Initialize the MCP directory

```bash
node /path/to/create-prompt/bin/create-prompt init
```

This creates a `.mcp` folder in your project with:

```
your-project/
└── .mcp/
    ├── context/           # Your context files
    │   ├── persona.md     # AI personality/role
    │   ├── standards.md   # Coding standards
    │   ├── project_structure.md  # Auto-generated
    │   ├── latest_commit.md      # Auto-updated
    │   └── history.md            # Commit history
    ├── prompts/           # Prompt templates
    ├── schemas/           # Variable definitions
    ├── results/           # Generated prompts saved here
    └── config.json        # Configuration
```

### Step 3: Customize your context files

Edit the files in `.mcp/context/` to match your project:

**`.mcp/context/persona.md`** - Define how the AI should behave:
```markdown
---
priority: high
---

# Persona

You are a senior full-stack developer working on a PHP/Laravel project.
You write clean, well-documented code following PSR-12 standards.
You prefer simple solutions over complex abstractions.
```

**`.mcp/context/standards.md`** - Your coding standards:
```markdown
---
priority: high
---

# Coding Standards

- Use PHP 8.2+ features
- Follow Laravel conventions
- Write PHPDoc comments for public methods
- Use dependency injection
- Keep controllers thin, models fat
```

---

## Daily Workflow

### The Basic Flow

```
┌─────────────────────────────────────────────────────────┐
│  1. You have a task to do                               │
│     "I need to add Open Graph meta tags"                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  2. Run create-prompt enhance                           │
│     node bin/create-prompt enhance "Add OG meta tags"   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  3. Tool generates smart prompt with:                   │
│     ✓ Your persona & standards                          │
│     ✓ Relevant project structure                        │
│     ✓ Task-specific requirements (OG tag checklist)     │
│     ✓ Suggested files to examine                        │
│     ✗ Irrelevant commits filtered out                   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  4. Paste into Claude/GPT and get coding!               │
└─────────────────────────────────────────────────────────┘
```

### Command Examples

**Simple task:**
```bash
node bin/create-prompt enhance "Add a logout button"
```

**Specific task:**
```bash
node bin/create-prompt enhance "Fix the authentication bug in login flow"
```

**Feature request:**
```bash
node bin/create-prompt enhance "Create REST API endpoint for user profiles"
```

### Where's My Prompt?

After running `enhance`, your prompt is:
1. **Displayed** in the terminal
2. **Saved** to `.mcp/results/YYYY-MM-DD-task-name.md`

You can then copy from terminal or open the saved file.

---

## Understanding Smart Features

### Automatic Task Detection

The tool detects what type of task you're doing and adjusts accordingly:

| Your Intent | Detected Type | What Happens |
|-------------|---------------|--------------|
| "Add Open Graph tags" | SEO | Adds OG requirements checklist, excludes irrelevant commits |
| "Fix login bug" | Auth/Bugfix | Includes commit history, adds security checklist |
| "Create API endpoint" | API | Adds REST best practices, suggests controller files |
| "Add dark mode" | UI | Adds accessibility requirements, suggests component files |
| "Write unit tests" | Testing | Adds testing best practices, suggests test directories |

### Relevance Filtering

**Problem solved:** Your last commit was "Fix mobile drag and drop" but you're now working on "SEO meta tags" - that commit is irrelevant noise.

**Solution:** The tool scores content relevance and only includes what matters:

```
Intent: "Add Open Graph meta tags"

✓ Included (relevant):
  - Project structure (always useful)
  - Your persona & standards
  - Files containing: layout, head, meta

✗ Excluded (irrelevant):
  - "Fix mobile drag" commit (score: 0.0)
  - History about unrelated features
```

### Requirements Injection

Based on your task, relevant checklists are automatically added:

**SEO Task → OG Requirements:**
```markdown
## SEO & Meta Requirements
- og:title - Page title (max 60 chars)
- og:description - Summary (max 155 chars)
- og:image - Preview image (1200x630px)
- og:url - Canonical URL
```

**API Task → REST Requirements:**
```markdown
## API Development Requirements
- Use appropriate HTTP methods (GET, POST, PUT, DELETE)
- Return proper status codes
- Include error response format
- Add request validation
```

### File Suggestions

The tool suggests which files to examine:

```markdown
## Suggested Files to Examine

**Relevant directories:**
- `app/Views/`
- `resources/views/`

**Files to look for:**
- Files containing: `layout`
- Files containing: `head`
- Files containing: `meta`
```

---

## Customizing Your Context

### Adding Custom Context Files

Create new `.md` files in `.mcp/context/`:

**`.mcp/context/database.md`:**
```markdown
---
priority: medium
tags: [database, mysql]
---

# Database Context

We use MySQL 8.0 with the following tables:
- users (id, email, name, created_at)
- posts (id, user_id, title, content)
- comments (id, post_id, user_id, body)

Indexes exist on: users.email, posts.user_id
```

**`.mcp/context/api.md`:**
```markdown
---
priority: medium
tags: [api, rest]
---

# API Structure

Base URL: /api/v1/
Authentication: Bearer token (JWT)
Rate limiting: 100 requests/minute

Endpoints follow RESTful conventions.
```

### Context File Format

Each context file supports YAML frontmatter:

```markdown
---
priority: high | medium | low    # Inclusion priority
tags: [tag1, tag2]               # For categorization
type: project | commit | history # Content type
---

# Your Content Here

Write your context in markdown...
```

### Updating Project Structure

Regenerate the project structure anytime:

```bash
node bin/create-prompt project-structure
```

This updates `.mcp/context/project_structure.md` with your current file tree.

---

## Configuration Options

### `.mcp/config.json`

```json
{
  "defaults": {
    "template": "base",
    "target": "claude",
    "includeContext": true
  },
  "context": {
    "autoLoad": ["project", "persona", "standards"],
    "exclude": []
  },
  "relevance": {
    "enabled": true,
    "minScore": 0.3,
    "latestCommit": "auto",
    "history": "auto"
  },
  "taskTypes": {
    "detectEnabled": true,
    "injectRequirements": true,
    "suggestFiles": true
  }
}
```

### Configuration Explained

| Option | Values | Description |
|--------|--------|-------------|
| `relevance.minScore` | 0.0-1.0 | Minimum relevance score to include content (default: 0.3) |
| `relevance.latestCommit` | "always", "auto", "never" | When to include latest commit |
| `relevance.history` | "always", "auto", "never" | When to include commit history |
| `taskTypes.injectRequirements` | true/false | Auto-add task checklists |
| `taskTypes.suggestFiles` | true/false | Suggest relevant files |

---

## Tips & Best Practices

### 1. Be Specific in Your Intent

```bash
# Too vague
node bin/create-prompt enhance "fix bug"

# Better - more context for smarter filtering
node bin/create-prompt enhance "Fix the null pointer exception in user authentication"
```

### 2. Keep Context Files Updated

After major changes:
```bash
# Regenerate project structure
node bin/create-prompt project-structure

# Update after commits (if using finish command)
node bin/create-prompt finish
```

### 3. Use Consistent Keywords

The tool recognizes these keywords for task detection:

- **SEO:** meta, og, open graph, twitter card, seo, sitemap
- **API:** api, endpoint, route, rest, controller
- **Auth:** login, logout, auth, password, session, token
- **UI:** component, button, modal, form, layout, style
- **Testing:** test, spec, unit, integration, e2e
- **Database:** query, migration, model, schema, database

### 4. Review Generated Prompts

Always check `.mcp/results/` to see what was generated. This helps you:
- Understand what context is being included
- Identify missing context you should add
- Improve your intent phrasing

### 5. Create Project-Specific Context

The more context you provide, the better your prompts:

```
.mcp/context/
├── persona.md          # Your AI assistant's role
├── standards.md        # Coding conventions
├── architecture.md     # System design decisions
├── database.md         # Schema and relationships
├── api.md              # API conventions
└── deployment.md       # Deployment process
```

---

## Command Reference

| Command | Description |
|---------|-------------|
| `create-prompt init` | Initialize .mcp directory in current project |
| `create-prompt enhance "intent"` | Generate smart prompt for your task |
| `create-prompt project-structure` | Regenerate project structure context |
| `create-prompt finish` | Record what you did (updates history) |
| `create-prompt --help` | Show all available commands |

---

## Troubleshooting

### "MCP not initialized"

Run `node bin/create-prompt init` in your project directory first.

### Prompt seems incomplete

Check that your context files exist in `.mcp/context/` and have content.

### Wrong task type detected

Be more specific in your intent. Include keywords that match your task type.

### Too much/too little context

Adjust `relevance.minScore` in `.mcp/config.json`:
- Lower (0.1-0.2): Include more context
- Higher (0.4-0.5): Be more selective

---

## Example: Complete Workflow

```bash
# 1. One-time setup
cd ~/projects/my-laravel-app
node ~/tools/create-prompt/bin/create-prompt init

# 2. Edit your persona
nano .mcp/context/persona.md
# Add: "You are a Laravel expert..."

# 3. Generate prompt for today's task
node ~/tools/create-prompt/bin/create-prompt enhance "Add user profile API endpoint with avatar upload"

# 4. Copy the generated prompt and paste into Claude

# 5. After implementing, record what you did
node ~/tools/create-prompt/bin/create-prompt finish

# 6. Next task...
node ~/tools/create-prompt/bin/create-prompt enhance "Write tests for profile endpoint"
```

---

Happy prompting!
