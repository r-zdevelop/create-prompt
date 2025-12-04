const fs = require('fs');
const config = require('../config');
const { getProjectStructureString } = require('../utils/tree');

/**
 * Generate and save project structure to a markdown file
 */
function generateStructure() {
  console.log('\nGenerating project structure...\n');

  const tree = getProjectStructureString();
  const filename = 'project_structure.md';
  const content = `# Project Structure\n\n\`\`\`\n${tree}\`\`\`\n`;

  fs.writeFileSync(filename, content);

  console.log(config.MESSAGES.STRUCTURE_GENERATED(filename));
  console.log('\nPreview:\n');
  console.log(tree);
}

module.exports = generateStructure;
