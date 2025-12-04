const readline = require('readline');

/**
 * Promisified input collector for CLI
 */
class InputCollector {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  /**
   * Ask a question and return the answer as a promise
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User's answer
   */
  ask(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask a question with validation
   * @param {string} question - Question to ask
   * @param {Function} validator - Validation function (returns error message or null)
   * @param {string} errorMessage - Default error message
   * @returns {Promise<string>} Validated answer
   */
  async askWithValidation(question, validator, errorMessage) {
    while (true) {
      const answer = await this.ask(question);
      const error = validator(answer);

      if (!error) {
        return answer;
      }

      console.log(error || errorMessage);
    }
  }

  /**
   * Ask for comma-separated tags
   * @param {string} question - Question to ask
   * @returns {Promise<string[]>} Array of tags
   */
  async askTags(question) {
    const input = await this.ask(question);
    if (!input) return [];

    return input
      .split(',')
      .map(t => t.trim())
      .filter(t => t);
  }

  /**
   * Close the readline interface
   */
  close() {
    this.rl.close();
  }
}

module.exports = InputCollector;
