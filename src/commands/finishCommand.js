const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { createInterface } = require('readline');
const config = require('../config');
const { rebuildBasePrompt } = require('../services/contextService');

/**
 * Ask user a question and return the answer
 * @param {readline.Interface} rl - Readline interface
 * @param {string} question - Question to ask
 * @param {boolean} required - Whether the answer is required
 * @returns {Promise<string>} User's answer
 */
function askQuestion(rl, question, required = false) {
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(question, (answer) => {
        if (required && !answer.trim()) {
          console.log("This field is required. Please provide an answer.");
          ask();
        } else {
          resolve(answer.trim());
        }
      });
    };
    ask();
  });
}

/**
 * Get list of modified/added/deleted files from git status
 * @returns {Array} Array of file objects {path, status}
 */
function getModifiedFiles() {
  try {
    const output = execSync('git status --porcelain', { encoding: 'utf8' });
    const files = [];

    output.split('\n').forEach(line => {
      if (!line.trim()) return;

      const statusCode = line.substring(0, 2).trim();
      const filePath = line.substring(3).trim();

      let status = 'Modified';
      if (statusCode === 'A' || statusCode === '??') status = 'Added';
      else if (statusCode === 'D') status = 'Deleted';
      else if (statusCode === 'M') status = 'Modified';
      else if (statusCode === 'R') status = 'Renamed';

      files.push({ path: filePath, status });
    });

    return files;
  } catch (error) {
    return [];
  }
}

/**
 * Ask user for changes description for each file
 * @param {readline.Interface} rl - Readline interface
 * @param {Array} files - Array of file objects
 * @returns {Promise<string>} Formatted changes table
 */
async function askForChangesTable(rl, files) {
  if (files.length === 0) {
    console.log("\nNo files detected in git status.");
    return '';
  }

  console.log("\nDescribe changes for each file (press Enter 3 times to finish):");
  console.log("Tip: Use • for bullet points, <br> for line breaks\n");

  const tableRows = [];
  let emptyCount = 0;

  for (const file of files) {
    const description = await askQuestion(
      rl,
      `What did you do in "${file.path}"? (${file.status}) \n> `,
      false
    );

    if (!description) {
      emptyCount++;
      if (emptyCount >= 3) {
        console.log("Finishing table input...");
        break;
      }
      // Add file to table with default description
      tableRows.push({
        file: `**${file.path}**`,
        type: file.status,
        changes: 'No description provided'
      });
    } else {
      emptyCount = 0;
      tableRows.push({
        file: `**${file.path}**`,
        type: file.status,
        changes: description
      });
    }
  }

  if (tableRows.length === 0) {
    return '';
  }

  // Build the markdown table
  let table = '| File | Type | Changes |\n';
  table += '|------|------|---------|';

  tableRows.forEach(row => {
    table += `\n| ${row.file} | ${row.type} | ${row.changes} |`;
  });

  return table;
}

/**
 * Get git status output
 * @returns {string} Git status output
 */
function getGitStatus() {
  try {
    return execSync('git status', { encoding: 'utf8' });
  } catch (error) {
    console.error('Error running git status:', error.message);
    return '';
  }
}

/**
 * Perform git commit
 * @param {string} message - Commit message
 * @returns {boolean} Success status
 */
function performGitCommit(message) {
  try {
    // Add all changes
    execSync('git add .', { encoding: 'utf8' });

    // Commit with message
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });

    return true;
  } catch (error) {
    console.error('Error performing git commit:', error.message);
    return false;
  }
}

/**
 * Create or replace latest_commit.md file in .mcp/context/
 * @param {string} whatUserDid - What the user did in the directory
 * @param {string} changesTable - Changes table
 * @param {string} gitStatus - Git status output
 */
function createLatestCommitFile(whatUserDid, changesTable, gitStatus) {
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const contextDir = path.join(promptsDir, 'context');

  // Ensure .mcp/context directory exists
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  const latestCommitPath = path.join(contextDir, 'latest_commit.md');
  const timestamp = new Date().toISOString();

  let content = `---
type: commit
priority: medium
tags: [git, changes]
---

# Latest Commit

**${whatUserDid}**

**Date:** ${timestamp}
`;

  // Add Changes section if table is provided
  if (changesTable && changesTable.trim()) {
    content += `
## Changes

${changesTable}
`;
  }

  content += `
## Git Status Before Commit

\`\`\`
${gitStatus}
\`\`\`
`;

  fs.writeFileSync(latestCommitPath, content);
  console.log(`\n✅ Created/updated: ${latestCommitPath}`);
}


/**
 * Update history.md in context/ with new entry
 * @param {string} whatUserDid - What the user did
 */
function updateHistoryFile(whatUserDid) {
  const promptsDir = path.join(process.cwd(), config.PROMPT_DIR);
  const contextDir = path.join(promptsDir, 'context');
  const historyPath = path.join(contextDir, 'history.md');

  // Ensure context directory exists
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().slice(0, 10);
  const newEntry = `- ${timestamp}: ${whatUserDid}`;

  if (fs.existsSync(historyPath)) {
    // Read existing file and add new entry after the header
    let content = fs.readFileSync(historyPath, 'utf8');

    // Find the # History header and add entry after it
    const historyHeaderRegex = /(# History\n+)/;

    if (historyHeaderRegex.test(content)) {
      content = content.replace(historyHeaderRegex, `$1${newEntry}\n`);
    } else {
      // If no header found, append to end
      content += `\n${newEntry}`;
    }

    fs.writeFileSync(historyPath, content);
  } else {
    // Create new history file with YAML frontmatter
    const content = `---
type: history
priority: low
tags: [changelog, tracking]
---

# History

${newEntry}
`;
    fs.writeFileSync(historyPath, content);
  }

  console.log(`✅ Updated: ${historyPath}`);
}

/**
 * Build full formatted commit message
 * @param {string} whatUserDid - What the user did in the directory
 * @param {string} changesTable - Changes table
 * @returns {string} Formatted commit message
 */
function buildCommitMessage(whatUserDid, changesTable) {
  const timestamp = new Date().toISOString();

  let message = `## ${whatUserDid}

**Date:** ${timestamp}
`;

  // Add Changes section if table is provided
  if (changesTable && changesTable.trim()) {
    message += `
### Changes

${changesTable}
`;
  }

  return message;
}

/**
 * Finish command - handles the complete workflow
 */
async function finishCommand() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\n🏁 Finishing up your work...\n');

    // Step 1: Ask what the user did (mandatory)
    const whatUserDid = await askQuestion(
      rl,
      "What did you do in this directory? (required)\n> ",
      true
    );

    // Step 2: Run git status
    console.log('\n📊 Running git status...\n');
    const gitStatus = getGitStatus();
    console.log(gitStatus);

    // Step 3: Get modified files and ask for changes table (optional)
    const modifiedFiles = getModifiedFiles();
    const changesTable = await askForChangesTable(rl, modifiedFiles);

    // Step 4: Create or replace latest_commit.md in context/
    createLatestCommitFile(whatUserDid, changesTable, gitStatus);

    // Step 5: Update history.md in context/
    updateHistoryFile(whatUserDid);

    // Step 6: Rebuild base_prompt.md from all context files
    const mcpDir = path.join(process.cwd(), config.PROMPT_DIR);
    rebuildBasePrompt(mcpDir);

    // Step 7: Perform the commit with full formatted message
    console.log('\n💾 Creating git commit...');
    const commitMessage = buildCommitMessage(whatUserDid, changesTable);
    const success = performGitCommit(commitMessage);

    if (success) {
      console.log('✅ Commit created successfully!\n');
    } else {
      console.log('❌ Failed to create commit. Please check the errors above.\n');
    }

  } catch (error) {
    console.error('Error during finish command:', error.message);
  } finally {
    rl.close();
  }
}

module.exports = finishCommand;
