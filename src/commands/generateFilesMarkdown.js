const fs = require('fs');
const path = require('path');
const config = require('../config');

/**
 * Generate a markdown file with the contents of files listed in requested_files.txt
 * @param {Object} options - Command options
 * @param {string} options.inputFile - Input file name (default: requested_files.txt)
 * @param {string} options.outputFile - Output file name (default: requested_files.md)
 */
async function generateFilesMarkdown(options = {}) {
  const inputFile = options.inputFile || 'requested_files.txt';
  const outputFile = options.outputFile || 'requested_files.md';

  // Check if input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`❌ Error: ${inputFile} not found in this directory.`);
    process.exit(1);
  }

  try {
    // Initialize output file
    let output = '# Requested Files Output\n\n';

    // Read the input file
    const fileList = fs.readFileSync(inputFile, 'utf-8')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

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
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = generateFilesMarkdown;
