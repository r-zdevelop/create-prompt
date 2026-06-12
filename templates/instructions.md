---
type: instructions
priority: low
tags: [workflow, files, instructions]
---

# File Request Workflow

1. **Identify relevant files**: using the project structure above, determine which files you need to see to complete the task.
2. **Request their content**: before proposing changes to files you have not seen, reply with ONLY the list of file paths you need, one per line, in this exact format:

```
src/services/example.js
src/utils/helper.js
```

3. The user will paste that list into `.create-prompt/requested_files.txt`, run `p fm`, and share the generated `requested_files.md` with you.
4. Once you have the file contents, complete the task.

# Rules

- Only request files that exist in the project structure.
- Never invent or assume the content of a file you have not seen.
- Keep the file list minimal: request only what the task actually needs.
