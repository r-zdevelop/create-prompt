const fs = require('fs');
const path = require('path');
const config = require('../config');
const { rebuildBasePrompt } = require('../services/contextService');

/**
 * List available persona template names
 * @returns {string[]} Persona names (without extension)
 */
function listPersonas() {
  if (!fs.existsSync(config.PERSONAS_DIR)) {
    return [];
  }

  return fs.readdirSync(config.PERSONAS_DIR)
    .filter(entry => entry.endsWith('.md'))
    .map(entry => path.basename(entry, '.md'))
    .sort();
}

/**
 * Install a persona template into .create-prompt/context/persona.md
 * - `p persona` lists available personas
 * - `p persona <name>` installs the persona (use --force to overwrite)
 * @param {string} name - Persona template name
 * @param {Object} options - Parsed CLI options
 */
function personaCommand(name, options = {}) {
  const available = listPersonas();

  if (!name) {
    console.log('\nAvailable personas:\n');
    available.forEach(p => console.log(`  - ${p}`));
    console.log('\nUsage: p persona <name>\n');
    return;
  }

  if (!available.includes(name)) {
    console.log(`\n❌ Unknown persona: '${name}'`);
    console.log(`Available: ${available.join(', ')}\n`);
    process.exitCode = 1;
    return;
  }

  const promptDir = path.join(process.cwd(), config.PROMPT_DIR);
  const contextDir = path.join(promptDir, 'context');
  if (!fs.existsSync(contextDir)) {
    fs.mkdirSync(contextDir, { recursive: true });
  }

  const targetPath = path.join(contextDir, 'persona.md');
  if (fs.existsSync(targetPath) && !options.force) {
    console.log(`\n⚠️  ${path.join(config.PROMPT_DIR, 'context', 'persona.md')} already exists.`);
    console.log(`Run 'p persona ${name} --force' to replace it.\n`);
    return;
  }

  const sourcePath = path.join(config.PERSONAS_DIR, `${name}.md`);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`\n✅ Persona '${name}' installed to ${path.join(config.PROMPT_DIR, 'context', 'persona.md')}`);

  // Rebuild base_prompt.md so the persona takes effect
  rebuildBasePrompt(promptDir);
  console.log('');
}

module.exports = personaCommand;
