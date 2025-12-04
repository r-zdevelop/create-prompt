# create-prompt

> Your daily prompt framework - organized AI prompts with smart auto-filling

## Features

- **Smart Mode** (default): Asks for tags, task, and auto-fills context from your project
- **Quick Mode** (`--quick` or `-q`): Minimal questions, fast prompt creation
- **Auto-detection**: Reads package.json to fill tools, versions, and environment
- **Project Structure**: Auto-generates project tree in your prompts
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
1. What's the last thing you did?
2. Prompt name/title
3. Tags (optional, comma-separated)
4. Task/goal (optional)

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

### Generate Project Structure Only
```bash
create-prompt --project-structure
```

Creates `project_structure.md` with your project tree (respects .gitignore).

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

## Roadmap (Prompt Framework Vision)

- [ ] Profile presets (coding, architecture, debugging)
- [ ] Custom placeholders via config file
- [ ] Integration with AI tools
- [ ] Prompt versioning
- [ ] Search/filter prompts by tags

## License

MIT