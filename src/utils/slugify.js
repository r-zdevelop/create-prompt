/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - Text to slugify
 * @returns {string} Slugified text
 */
function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Generate a filename for a prompt
 * @param {string} promptName - Name of the prompt
 * @param {string} promptDir - Directory where prompts are stored
 * @returns {string} Generated filename
 */
function generatePromptFilename(promptName, promptDir) {
  const fs = require('fs');
  const slug = slugify(promptName);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  const todayFiles = fs.readdirSync(promptDir).filter(f => f.startsWith(date));
  const count = String(todayFiles.length + 1).padStart(2, '0');

  return `${date}_${count}_${slug}.md`;
}

module.exports = {
  slugify,
  generatePromptFilename
};
