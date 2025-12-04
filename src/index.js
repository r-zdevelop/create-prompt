const { createCLI } = require('./cli');
const config = require('./config');

// Export main CLI factory
module.exports = {
  createCLI,
  config
};
