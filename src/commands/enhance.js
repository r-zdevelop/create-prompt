/**
 * Enhance Command
 *
 * Generate contextualized prompts from casual user intents.
 * Uses .mcp directory for context, schemas, and templates.
 */

const fs = require('fs');
const path = require('path');
const { generatePrompt, getMcpSummary, validateMcpStructure } = require('../services/mcpService');
const { getIntentSummary } = require('../services/intentService');
const config = require('../config');
const InputCollector = require('../utils/input');

/**
 * Parse enhance command arguments
 * @param {string[]} args - Command line arguments
 * @returns {Object} - Parsed options
 */
function parseEnhanceArgs(args) {
  const options = {
    intent: null,
    template: null,
    target: 'claude',
    output: null,
    interactive: false,
    dryRun: false,
    noContext: false,
    context: null,
    vars: {},
    verbose: false,
    format: 'markdown',
    copy: false
  };

  const intentParts = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--template' || arg === '-t') {
      options.template = args[++i];
    } else if (arg === '--target' || arg === '-T') {
      options.target = args[++i];
    } else if (arg === '--output' || arg === '-o') {
      options.output = args[++i];
    } else if (arg === '--interactive' || arg === '-i') {
      options.interactive = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--no-context') {
      options.noContext = true;
    } else if (arg === '--context' || arg === '-c') {
      options.context = args[++i]?.split(',');
    } else if (arg === '--vars' || arg === '-v') {
      const varStr = args[++i];
      if (varStr) {
        const [key, value] = varStr.split('=');
        if (key && value) {
          options.vars[key] = value;
        }
      }
    } else if (arg === '--verbose' || arg === '-V') {
      options.verbose = true;
    } else if (arg === '--format' || arg === '-f') {
      options.format = args[++i];
    } else if (arg === '--copy') {
      options.copy = true;
    } else if (!arg.startsWith('-') && arg !== 'enhance' && arg !== 'e') {
      intentParts.push(arg);
    }
  }

  options.intent = intentParts.join(' ').trim();

  return options;
}

/**
 * Main enhance command function
 * @param {string[]} args - Command line arguments
 */
async function enhance(args) {
  const options = parseEnhanceArgs(args);
  const inputCollector = new InputCollector();

  try {
    // Check MCP structure
    const validation = validateMcpStructure('.mcp');
    if (!validation.valid) {
      console.error('\n❌ MCP validation failed:');
      for (const error of validation.errors) {
        console.error(`   • ${error}`);
      }
      console.error('\nRun `create-prompt mcp-init` to initialize MCP structure.');
      return;
    }

    // Show warnings if verbose
    if (options.verbose && validation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      for (const warning of validation.warnings) {
        console.log(`   • ${warning}`);
      }
    }

    // Interactive mode or get intent
    let intent = options.intent;

    if (!intent || options.interactive) {
      // Show MCP summary in interactive mode
      if (options.interactive) {
        const summary = await getMcpSummary('.mcp');
        console.log('\n📦 MCP Context:');
        console.log(`   Templates: ${summary.templates.join(', ') || 'none'}`);
        console.log(`   Context: ${summary.context.join(', ') || 'none'}`);
        console.log(`   Schemas: ${summary.schemas.join(', ') || 'none'}`);
        console.log('');
      }

      if (!intent) {
        intent = await inputCollector.ask('What would you like to create? ');
        if (!intent.trim()) {
          console.log('No intent provided. Exiting.');
          return;
        }
      }
    }

    // Dry run - show what would be generated
    if (options.dryRun) {
      console.log('\n🔍 Dry Run Mode\n');
      console.log(`Intent: "${intent}"`);
      console.log(`Template: ${options.template || 'auto-detect'}`);
      console.log(`Target: ${options.target}`);
      console.log(`Include Context: ${!options.noContext}`);

      // Parse intent for preview
      const { parseIntent } = require('../services/intentService');
      const parsed = parseIntent(intent);
      console.log(`\nParsed Intent:`);
      console.log(`   ${getIntentSummary(parsed)}`);
      return;
    }

    // Generate prompt
    console.log('\n⚙️  Generating prompt...\n');

    const result = await generatePrompt(intent, {
      mcpRoot: '.mcp',
      template: options.template,
      target: options.target,
      includeContext: !options.noContext,
      contextFiles: options.context,
      variables: options.vars,
      format: options.format
    });

    // Handle errors
    if (!result.prompt) {
      console.error('❌ Failed to generate prompt:');
      for (const error of result.metadata.errors || []) {
        console.error(`   • ${error}`);
      }
      return;
    }

    // Show warnings
    if (result.warnings.length > 0 && options.verbose) {
      console.log('⚠️  Warnings:');
      for (const warning of result.warnings) {
        console.log(`   • ${warning}`);
      }
      console.log('');
    }

    // Output handling
    if (options.output) {
      // Write to file
      const outputPath = path.resolve(options.output);
      fs.writeFileSync(outputPath, result.prompt, 'utf-8');
      console.log(`✅ Prompt saved to: ${outputPath}`);
    } else {
      // Output to console
      console.log('─'.repeat(60));
      console.log(result.prompt);
      console.log('─'.repeat(60));
    }

    // Show metadata
    if (options.verbose) {
      console.log('\n📊 Metadata:');
      console.log(`   Template: ${result.metadata.template}`);
      console.log(`   Target: ${result.metadata.target}`);
      console.log(`   Action: ${result.metadata.intent?.action || 'unknown'}`);
      console.log(`   Components: ${result.metadata.intent?.components?.join(', ') || 'none'}`);
      console.log(`   Context Used: ${result.metadata.contextUsed?.join(', ') || 'none'}`);
      console.log(`   Schemas Used: ${result.metadata.schemasUsed?.join(', ') || 'none'}`);
      console.log(`   Confidence: ${Math.round((result.metadata.intent?.confidence || 0) * 100)}%`);
    }

    // Copy to clipboard (if available)
    if (options.copy) {
      try {
        // Try using pbcopy (macOS), xclip (Linux), or clip (Windows)
        const { spawnSync } = require('child_process');
        const platform = process.platform;

        let cmd, cmdArgs;
        if (platform === 'darwin') {
          cmd = 'pbcopy';
          cmdArgs = [];
        } else if (platform === 'linux') {
          cmd = 'xclip';
          cmdArgs = ['-selection', 'clipboard'];
        } else if (platform === 'win32') {
          cmd = 'clip';
          cmdArgs = [];
        }

        if (cmd) {
          const proc = spawnSync(cmd, cmdArgs, { input: result.prompt });
          if (proc.status === 0) {
            console.log('\n📋 Copied to clipboard!');
          }
        }
      } catch (error) {
        // Silently fail if clipboard not available
      }
    }

    console.log('\n✅ Done!\n');

  } finally {
    inputCollector.close();
  }
}

module.exports = enhance;
