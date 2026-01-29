const { execSync } = require('child_process');
const { createInterface } = require('readline');

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

  console.log("\nDescribe changes for each file (press Enter to skip, 3 skips to finish):\n");

  const tableRows = [];
  let emptyCount = 0;

  for (const file of files) {
    const description = await askQuestion(
      rl,
      `"${file.path}" (${file.status}): `,
      false
    );

    if (!description) {
      emptyCount++;
      if (emptyCount >= 3) {
        console.log("Finishing table input...");
        break;
      }
      tableRows.push({
        file: `**${file.path}**`,
        type: file.status,
        changes: '-'
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
    execSync('git add .', { encoding: 'utf8' });
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { encoding: 'utf8' });
    return true;
  } catch (error) {
    console.error('Error performing git commit:', error.message);
    return false;
  }
}

/**
 * Build commit message with changes table
 * @param {string} summary - Commit summary
 * @param {string} changesTable - Changes table
 * @returns {string} Formatted commit message
 */
function buildCommitMessage(summary, changesTable) {
  let message = `## ${summary}`;

  if (changesTable && changesTable.trim()) {
    message += `\n\n### Changes\n\n${changesTable}`;
  }

  return message;
}

/**
 * Finish command - git commit with changes table
 */
async function finishCommand() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('\n🏁 Finishing up your work...\n');

    // Show git status
    console.log('📊 Git status:\n');
    const gitStatus = getGitStatus();
    console.log(gitStatus);

    // Ask for commit summary
    const summary = await askQuestion(
      rl,
      "What did you do? (commit summary): ",
      true
    );

    // Get modified files and ask for changes table
    const modifiedFiles = getModifiedFiles();
    const changesTable = await askForChangesTable(rl, modifiedFiles);

    // Build and perform the commit
    console.log('\n💾 Creating git commit...');
    const commitMessage = buildCommitMessage(summary, changesTable);
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
