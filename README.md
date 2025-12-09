# create-prompt

> Your daily prompt framework - organized AI prompts with smart auto-filling and git workflow integration

## Features

- **Smart Mode** (default): Asks for tags, task, and auto-fills context from your project
- **Quick Mode** (`--quick` or `-q`): Minimal questions, fast prompt creation
- **Finish Command**: Complete your work with structured commit tracking and file change documentation
- **Project Structure Generation**: Auto-generates project tree with customizable ignore patterns
- **Auto-detection**: Reads package.json to fill tools, versions, and environment
- **History Tracking**: Keeps track of what you've been working on
- **Date & Counter**: Automatic YYYYMMDD_NN naming
- **Git Integration**: Automatically adds `.prompts` to `.gitignore` (if file exists)

## Installation

```bash
npm install -g create-prompt
```

Or use the short alias:

```bash
p
```

## Usage

### Smart Mode (default)
```bash
create-prompt
# or
p
```

Asks you:
1. Prompt name/title
2. Tags (optional, comma-separated)
3. Task/goal (optional)

Then auto-fills:
- Date
- Environment (OS)
- Tools (from package.json)
- Project structure
- History

### Quick Mode
```bash
create-prompt --quick
# or
p -q
```

Only asks the essential questions (last thing + prompt name).

### Skip History Question
```bash
create-prompt --no-history
# or combine with quick mode
p -q --no-history
```

Skips the history question and sets it to "N/A". Useful when you want to jump straight to creating prompts.

### Finish Your Work
```bash
create-prompt finish
# or
p finish
```

Complete your work session with an organized workflow:
1. Asks what you did (mandatory)
2. Shows git status
3. Asks for file-by-file change descriptions (press Enter 3 times to skip)
4. Creates/updates `.prompts/latest_commit.md` with detailed changes
5. Updates `.prompts/base_prompt.md` with latest commit info
6. Performs git commit automatically

**File descriptions:**
- If you provide a description: it's added to the table
- If you press Enter: adds "No description provided" to the table
- Press Enter 3 times in a row: finishes and commits

### Generate Project Structure
```bash
create-prompt project-structure
# or shortcut
p ps
```

Creates `.prompts/project_structure.md` with your project tree and updates `.prompts/base_prompt.md`.

**Customizable ignore patterns:**
- Respects `.gitignore` patterns
- Create `.prompts/ignore_files.txt` to add custom ignore patterns:
  ```txt
  public/images
  public/css
  *.log
  dist/
  ```

### Generate Files Markdown
```bash
create-prompt files-markdown
# or shortcut
p fm
```

Creates `.prompts/requested_files.md` containing the content of files listed in `.prompts/requested_files.txt`. Perfect for sharing multiple files with AI tools or for documentation purposes.

**How it works:**
- Create/edit `.prompts/requested_files.txt` with file paths (one per line)
- Run `p fm` to generate the markdown output
- Example `requested_files.txt`:
  ```txt
  src/index.js
  src/components/Header.jsx
  README.md
  ```

## Generated Files

The tool creates a `.prompts` directory in your project with:

- **`base_prompt.md`** - Your base template (auto-updated with project structure, history, and latest commit)
- **`YYYYMMDD_NN_slug.md`** - Individual prompts created with `p` command
- **`latest_commit.md`** - Most recent commit details with file changes table
- **`project_structure.md`** - Current project structure tree
- **`ignore_files.txt`** - Custom patterns to ignore in project structure (optional)
- **`requested_files.txt`** - List of file paths to include in markdown output (optional)
- **`requested_files.md`** - Generated markdown with file contents

## Template Customization

Edit `.prompts/base_prompt.md` to customize your prompt template. Changes will apply to all new prompts.

## Project Structure

```
create-prompt/
├── bin/
│   └── create-prompt
├── templates/
│   └── base_prompt.md
├── package.json
└── README.md
```

## Quick Reference

| Command | Shortcut | Description |
|---------|----------|-------------|
| `create-prompt` | `p` | Create a new prompt (smart mode) |
| `create-prompt --quick` | `p -q` | Create a new prompt (quick mode) |
| `create-prompt --no-history` | - | Skip history question |
| `create-prompt finish` | `p finish` | Finish work, create commit with file tracking |
| `create-prompt project-structure` | `p ps` | Generate project structure |
| `create-prompt files-markdown` | `p fm` | Generate markdown from file list |

## Workflow Example

```bash
# 1. Start your work session
p

# 2. Work on your code...

# 3. Generate updated project structure
p ps

# 4. Generate markdown from specific files
p fm

# 5. Finish and commit with detailed tracking
p finish
```

## Roadmap (Prompt Framework Vision)

- [ ] Profile presets (coding, architecture, debugging)
- [ ] Custom placeholders via config file
- [ ] Integration with AI tools
- [ ] Prompt versioning
- [ ] Search/filter prompts by tags

## License

MIT