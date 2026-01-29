const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Ensure requested_files.txt exists with default content
 */
function ensureRequestedFilesExists() {
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const requestedFilesPath = path.join(promptsDir, 'requested_files.txt');

  // Ensure .create-prompt directory exists
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }

  // Create requested_files.txt if it doesn't exist
  if (!fs.existsSync(requestedFilesPath)) {
    const defaultContent = `# Add file paths to include in the markdown output
# One file path per line
# Examples:
# src/index.js
# src/components/Header.jsx
# README.md
`;
    fs.writeFileSync(requestedFilesPath, defaultContent);
    console.log(`✅ Created: ${requestedFilesPath}`);
  }

  return requestedFilesPath;
}

/**
 * Generate a markdown file with the contents of files listed in requested_files.txt
 */
async function generateFilesMarkdown() {
  console.log('\nGenerating files markdown...\n');

  // Ensure requested_files.txt exists
  const inputFile = ensureRequestedFilesExists();

  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const outputFile = path.join(promptsDir, 'requested_files.md');

  try {
    // Initialize output file
    let output = '# Requested Files Output\n\n';

    // Read the input file
    const fileList = fs.readFileSync(inputFile, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));

    if (fileList.length === 0) {
      console.log('⚠️  No files listed in requested_files.txt');
      console.log(`   Add file paths to: ${inputFile}`);
      return;
    }

    // Process each file
    for (const file of fileList) {
      output += `## 📄 ${file}\n\n`;

      if (fs.existsSync(file)) {
        try {
          const content = fs.readFileSync(file, 'utf-8');
          output += '```\n';
          output += content;
          if (!content.endsWith('\n')) {
            output += '\n';
          }
          output += '```\n';
        } catch (error) {
          output += `**⚠️ Error reading file:** ${error.message}\n`;
        }
      } else {
        output += `**⚠️ File not found:** ${file}\n`;
      }

      output += '\n';
    }

    // Write the output file
    fs.writeFileSync(outputFile, output, 'utf-8');
    console.log(`✅ Markdown file generated: ${outputFile}`);
    console.log(`\nProcessed ${fileList.length} file(s)\n`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = generateFilesMarkdown;
