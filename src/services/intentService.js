/**
 * Intent Service
 *
 * Responsible for parsing casual user intents into structured requirements.
 * Matches keywords to templates, schemas, and context.
 * Integrates with relevance filtering and task type detection.
 */

const { scoreRelevance, extractTaskKeywords, isRelevant } = require('./relevanceService');
const { detectTaskType, shouldIncludeContext, getContextPriority } = require('./taskTypeService');
const config = require('../config');

/**
 * Action keywords mapping
 */
const ACTION_KEYWORDS = {
  create: ['create', 'make', 'build', 'add', 'generate', 'new', 'implement'],
  update: ['update', 'modify', 'change', 'edit', 'alter', 'revise'],
  delete: ['delete', 'remove', 'drop', 'clear', 'destroy'],
  fix: ['fix', 'repair', 'solve', 'debug', 'resolve', 'patch'],
  refactor: ['refactor', 'improve', 'optimize', 'clean', 'restructure'],
  document: ['document', 'describe', 'explain', 'annotate'],
  test: ['test', 'verify', 'validate', 'check']
};

/**
 * Component type keywords
 */
const COMPONENT_KEYWORDS = {
  ui: ['button', 'form', 'input', 'modal', 'dialog', 'card', 'list', 'table',
       'menu', 'navbar', 'sidebar', 'header', 'footer', 'layout', 'page',
       'component', 'widget', 'dropdown', 'select', 'checkbox', 'radio'],
  api: ['api', 'endpoint', 'route', 'controller', 'request', 'response',
        'rest', 'graphql', 'webhook', 'service'],
  data: ['database', 'schema', 'model', 'migration', 'query', 'table',
         'collection', 'index', 'relation'],
  auth: ['auth', 'authentication', 'authorization', 'login', 'logout',
         'signup', 'register', 'password', 'session', 'token', 'jwt', 'oauth'],
  workflow: ['workflow', 'process', 'flow', 'pipeline', 'automation',
             'integration', 'sync', 'job', 'task', 'cron']
};

/**
 * Parse intent string into structured object
 * @param {string} intentString - Raw user intent
 * @returns {Object} - Parsed intent
 */
function parseIntent(intentString) {
  const normalized = intentString.toLowerCase().trim();
  const words = normalized.split(/\s+/);

  // Extract action
  const action = detectAction(words);

  // Extract components and keywords
  const { components, keywords, types } = extractComponents(words);

  // Extract schema references (e.g., "color palette X", "colors.primary")
  const schemaRefs = extractSchemaReferences(intentString);

  // Extract context hints
  const contextHints = extractContextHints(words);

  // Build requirements list
  const requirements = buildRequirements(action, components, types, intentString);

  // Determine relevant templates
  const suggestedTemplates = determineSuggestedTemplates(types);

  return {
    raw: intentString,
    action,
    components,
    keywords,
    types,
    references: {
      schemas: schemaRefs,
      context: contextHints
    },
    requirements,
    suggestedTemplates,
    confidence: calculateConfidence({ action, components, types })
  };
}

/**
 * Detect the primary action from words
 * @param {string[]} words - Tokenized intent
 * @returns {string} - Detected action
 */
function detectAction(words) {
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    for (const word of words) {
      if (keywords.includes(word)) {
        return action;
      }
    }
  }
  return 'create'; // Default action
}

/**
 * Extract components and their types from words
 * @param {string[]} words - Tokenized intent
 * @returns {{ components: string[], keywords: string[], types: string[] }}
 */
function extractComponents(words) {
  const components = [];
  const keywords = [];
  const types = new Set();

  for (const word of words) {
    // Check against component keywords
    for (const [type, typeKeywords] of Object.entries(COMPONENT_KEYWORDS)) {
      if (typeKeywords.includes(word)) {
        components.push(word);
        types.add(type);
      }
    }
    // Collect all meaningful words as keywords (filter common words)
    if (!isStopWord(word) && word.length > 2) {
      keywords.push(word);
    }
  }

  return {
    components,
    keywords,
    types: [...types]
  };
}

/**
 * Check if word is a stop word
 * @param {string} word - Word to check
 * @returns {boolean}
 */
function isStopWord(word) {
  const stopWords = [
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'that', 'this', 'these',
    'those', 'it', 'its', 'my', 'your', 'our', 'their', 'i', 'me', 'we', 'us'
  ];
  return stopWords.includes(word);
}

/**
 * Extract schema references from intent
 * @param {string} intent - Raw intent string
 * @returns {string[]} - Schema references
 */
function extractSchemaReferences(intent) {
  const refs = [];

  // Match patterns like "colors.primary" or "schema.colors.X"
  const dotPattern = /(?:schema\.)?(\w+\.\w+(?:\.\w+)?)/gi;
  let match;
  while ((match = dotPattern.exec(intent)) !== null) {
    refs.push(match[1]);
  }

  // Match patterns like "color palette", "primary color", etc.
  const namedPatterns = [
    /(\w+)\s+palette/gi,
    /(\w+)\s+color/gi,
    /(\w+)\s+theme/gi,
    /(\w+)\s+style/gi
  ];

  for (const pattern of namedPatterns) {
    while ((match = pattern.exec(intent)) !== null) {
      const schemaName = match[1].toLowerCase();
      if (!['the', 'a', 'my', 'our', 'with'].includes(schemaName)) {
        refs.push(`colors.${schemaName}`);
      }
    }
  }

  return [...new Set(refs)];
}

/**
 * Extract context hints from words
 * @param {string[]} words - Tokenized intent
 * @returns {string[]} - Context file hints
 */
function extractContextHints(words) {
  const contextKeywords = {
    project: ['project', 'overview', 'about'],
    architecture: ['architecture', 'system', 'design', 'structure'],
    conventions: ['convention', 'standard', 'style', 'pattern'],
    api: ['api', 'endpoint', 'rest', 'graphql'],
    auth: ['auth', 'authentication', 'security']
  };

  const hints = new Set();

  for (const word of words) {
    for (const [context, keywords] of Object.entries(contextKeywords)) {
      if (keywords.includes(word)) {
        hints.add(context);
      }
    }
  }

  return [...hints];
}

/**
 * Build structured requirements from parsed data
 * @param {string} action - Detected action
 * @param {string[]} components - Detected components
 * @param {string[]} types - Detected types
 * @param {string} raw - Raw intent
 * @returns {Object[]} - Requirements array
 */
function buildRequirements(action, components, types, raw) {
  const requirements = [];

  if (components.length === 0) {
    // Generic requirement from raw intent
    requirements.push({
      type: 'general',
      action,
      description: raw
    });
  } else {
    // Build requirement for each component
    for (const component of components) {
      const type = types.find(t =>
        COMPONENT_KEYWORDS[t]?.includes(component)
      ) || 'general';

      requirements.push({
        type,
        action,
        component,
        description: `${action} ${component}`
      });
    }
  }

  return requirements;
}

/**
 * Determine suggested templates based on detected types
 * @param {string[]} types - Detected types
 * @returns {string[]} - Suggested template names
 */
function determineSuggestedTemplates(types) {
  const templateMapping = {
    ui: 'ui',
    api: 'api',
    data: 'api',
    auth: 'workflow',
    workflow: 'workflow'
  };

  const templates = new Set(['base']); // Always include base

  for (const type of types) {
    if (templateMapping[type]) {
      templates.add(templateMapping[type]);
    }
  }

  return [...templates];
}

/**
 * Calculate confidence score for the parsed intent
 * @param {Object} parsed - Parsed intent data
 * @returns {number} - Confidence 0-1
 */
function calculateConfidence({ action, components, types }) {
  let score = 0.3; // Base score

  if (action !== 'create') score += 0.2; // Non-default action detected
  if (components.length > 0) score += 0.3;
  if (types.length > 0) score += 0.2;

  return Math.min(score, 1);
}

/**
 * Match intent to available templates
 * @param {Object} parsedIntent - Parsed intent object
 * @param {Object} templates - Available templates
 * @returns {string} - Best matching template name
 */
function matchTemplates(parsedIntent, templates) {
  const templateNames = Object.keys(templates);

  // Check suggested templates first
  for (const suggested of parsedIntent.suggestedTemplates) {
    if (templateNames.includes(suggested)) {
      return suggested;
    }
  }

  // Fall back to base
  return templateNames.includes('base') ? 'base' : templateNames[0];
}

/**
 * Infer which context files are needed
 * @param {Object} parsedIntent - Parsed intent
 * @param {Object} contextFiles - Available context files
 * @param {Object} options - Inference options
 * @returns {string[]} - Recommended context file names
 */
function inferContext(parsedIntent, contextFiles, options = {}) {
  const {
    filterByRelevance = true,
    minRelevance = config.RELEVANCE?.MIN_SCORE || 0.3,
    includeLatestCommit = config.RELEVANCE?.INCLUDE_LATEST_COMMIT || 'auto',
    includeHistory = config.RELEVANCE?.INCLUDE_HISTORY || 'auto'
  } = options;

  const available = Object.keys(contextFiles);
  const recommended = [];
  const scores = new Map();

  // Detect task type
  const taskTypeResult = detectTaskType(parsedIntent);
  const taskType = taskTypeResult.type;

  // Extract keywords from intent for relevance scoring
  const keywords = extractTaskKeywords(parsedIntent.raw || parsedIntent);

  // Get essential context (always include if available)
  const essentialContext = config.RELEVANCE?.ESSENTIAL_CONTEXT || ['persona', 'standards', 'project'];

  // Add essential context first
  for (const essential of essentialContext) {
    if (available.includes(essential) && !recommended.includes(essential)) {
      recommended.push(essential);
      scores.set(essential, 1.0); // Max score for essential
    }
  }

  // Add project_structure (special handling)
  if (available.includes('project_structure') && !recommended.includes('project_structure')) {
    recommended.push('project_structure');
    scores.set('project_structure', 0.9);
  }

  // Add context based on hints
  for (const hint of parsedIntent.references.context) {
    if (available.includes(hint) && !recommended.includes(hint)) {
      recommended.push(hint);
      scores.set(hint, 0.8);
    }
  }

  // Add context based on detected types
  for (const type of parsedIntent.types) {
    if (available.includes(type) && !recommended.includes(type)) {
      recommended.push(type);
      scores.set(type, 0.7);
    }
  }

  // Handle latest_commit based on task type and relevance
  if (available.includes('latest_commit') && !recommended.includes('latest_commit')) {
    const shouldInclude = handleSpecialContext('latest_commit', {
      contextFiles,
      keywords,
      taskType,
      mode: includeLatestCommit,
      minRelevance
    });
    if (shouldInclude.include) {
      recommended.push('latest_commit');
      scores.set('latest_commit', shouldInclude.score);
    }
  }

  // Handle history based on task type and relevance
  if (available.includes('history') && !recommended.includes('history')) {
    const shouldInclude = handleSpecialContext('history', {
      contextFiles,
      keywords,
      taskType,
      mode: includeHistory,
      minRelevance
    });
    if (shouldInclude.include) {
      recommended.push('history');
      scores.set('history', shouldInclude.score);
    }
  }

  // Score and filter remaining context files
  if (filterByRelevance) {
    for (const name of available) {
      if (recommended.includes(name)) continue;

      // Check if task type excludes this context
      if (!shouldIncludeContext(taskType, name)) continue;

      const file = contextFiles[name];
      const content = file.content || '';
      const score = scoreRelevance(content, keywords);

      if (score >= minRelevance) {
        recommended.push(name);
        scores.set(name, score);
      }
    }
  }

  // Sort by score (highest first), keeping essential at top
  const essentialSet = new Set(essentialContext);
  recommended.sort((a, b) => {
    // Essential context always comes first
    const aEssential = essentialSet.has(a);
    const bEssential = essentialSet.has(b);
    if (aEssential && !bEssential) return -1;
    if (!aEssential && bEssential) return 1;

    // Then sort by score
    return (scores.get(b) || 0) - (scores.get(a) || 0);
  });

  return recommended;
}

/**
 * Handle special context files (latest_commit, history)
 * @param {string} contextName - Context file name
 * @param {Object} options - Options for handling
 * @returns {{ include: boolean, score: number }}
 */
function handleSpecialContext(contextName, options) {
  const { contextFiles, keywords, taskType, mode, minRelevance } = options;

  // Always include mode
  if (mode === 'always') {
    return { include: true, score: 0.5 };
  }

  // Never include mode
  if (mode === 'never') {
    return { include: false, score: 0 };
  }

  // Auto mode - check task type and relevance
  // Bug fixes should always include commit history (it's useful for context)
  if (taskType === 'bugfix') {
    return { include: true, score: 0.7 };
  }

  // Check if task type excludes this context
  if (!shouldIncludeContext(taskType, contextName)) {
    return { include: false, score: 0 };
  }

  // Check relevance
  const file = contextFiles[contextName];
  if (!file || !file.content) {
    return { include: false, score: 0 };
  }

  const score = scoreRelevance(file.content, keywords);

  // Use a lower threshold for history to be more inclusive
  const effectiveThreshold = contextName === 'history' ? minRelevance * 0.7 : minRelevance;

  return {
    include: score >= effectiveThreshold,
    score
  };
}

/**
 * Get human-readable summary of parsed intent
 * @param {Object} parsedIntent - Parsed intent
 * @returns {string} - Summary string
 */
function getIntentSummary(parsedIntent) {
  const parts = [];

  parts.push(`Action: ${parsedIntent.action}`);

  if (parsedIntent.components.length > 0) {
    parts.push(`Components: ${parsedIntent.components.join(', ')}`);
  }

  if (parsedIntent.types.length > 0) {
    parts.push(`Types: ${parsedIntent.types.join(', ')}`);
  }

  if (parsedIntent.references.schemas.length > 0) {
    parts.push(`Schema refs: ${parsedIntent.references.schemas.join(', ')}`);
  }

  parts.push(`Confidence: ${Math.round(parsedIntent.confidence * 100)}%`);

  return parts.join(' | ');
}

module.exports = {
  parseIntent,
  matchTemplates,
  inferContext,
  getIntentSummary,
  ACTION_KEYWORDS,
  COMPONENT_KEYWORDS
};
