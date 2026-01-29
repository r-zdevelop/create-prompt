/**
 * Task Type Service
 *
 * Detects task categories and provides task-specific configurations.
 * Determines which context to include and which requirements to inject.
 */

/**
 * Task type definitions with patterns, relevant paths, and requirements
 */
const TASK_TYPES = {
  seo: {
    name: 'SEO & Meta',
    patterns: ['seo', 'meta', 'og:', 'open graph', 'opengraph', 'twitter card', 'sitemap', 'robots', 'canonical', 'metadata', 'structured data', 'schema.org'],
    relevantDirs: ['app/', 'pages/', 'components/seo', 'lib/meta', 'src/pages', 'views/', 'layouts/', 'templates/'],
    relevantFiles: ['layout', 'metadata', 'seo', 'head', '_document', '_app', 'base', 'master'],
    requirements: [
      'Include all required Open Graph meta tags',
      'Add Twitter Card meta tags',
      'Ensure canonical URL is set correctly',
      'Validate meta tag content lengths'
    ],
    excludeContext: ['latest_commit', 'history'],
    priority: ['project', 'standards', 'persona']
  },
  api: {
    name: 'API Development',
    patterns: ['api', 'endpoint', 'route', 'rest', 'graphql', 'backend', 'controller', 'handler', 'middleware', 'request', 'response'],
    relevantDirs: ['api/', 'routes/', 'controllers/', 'services/', 'handlers/', 'middleware/', 'src/api', 'app/Http'],
    relevantFiles: ['route', 'handler', 'controller', 'middleware', 'service', 'api'],
    requirements: [
      'Use appropriate HTTP methods (GET, POST, PUT, DELETE)',
      'Return proper status codes',
      'Include error response format',
      'Add request validation',
      'Document API endpoints'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'api', 'persona']
  },
  auth: {
    name: 'Authentication',
    patterns: ['auth', 'authentication', 'authorization', 'login', 'logout', 'signup', 'register', 'password', 'session', 'token', 'jwt', 'oauth', 'sso', 'credential'],
    relevantDirs: ['auth/', 'authentication/', 'middleware/', 'guards/', 'policies/', 'app/Auth', 'lib/auth'],
    relevantFiles: ['auth', 'login', 'session', 'token', 'middleware', 'guard', 'policy', 'user'],
    requirements: [
      'Implement secure password handling',
      'Use proper session management',
      'Add CSRF protection',
      'Validate credentials securely',
      'Handle authentication errors gracefully'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'auth', 'security', 'persona']
  },
  ui: {
    name: 'UI Components',
    patterns: ['component', 'button', 'modal', 'form', 'layout', 'style', 'css', 'design', 'interface', 'view', 'template', 'frontend', 'responsive', 'animation', 'dark mode', 'light mode', 'theme'],
    relevantDirs: ['components/', 'ui/', 'views/', 'styles/', 'css/', 'layouts/', 'src/components', 'app/components'],
    relevantFiles: ['component', 'button', 'modal', 'form', 'layout', 'style', 'css', 'view'],
    requirements: [
      'Follow component design patterns',
      'Ensure accessibility (a11y)',
      'Implement responsive design',
      'Use consistent styling'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'design', 'persona']
  },
  database: {
    name: 'Database',
    patterns: ['database', 'query', 'migration', 'model', 'schema', 'prisma', 'mongoose', 'sequelize', 'sql', 'mongodb', 'postgres', 'mysql', 'table', 'collection', 'index', 'relation'],
    relevantDirs: ['models/', 'migrations/', 'database/', 'db/', 'prisma/', 'schemas/', 'entities/'],
    relevantFiles: ['model', 'migration', 'schema', 'entity', 'repository', 'query'],
    requirements: [
      'Use parameterized queries to prevent SQL injection',
      'Add proper indexes for performance',
      'Implement database transactions where needed',
      'Handle database errors gracefully'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'database', 'persona']
  },
  testing: {
    name: 'Testing',
    patterns: ['test', 'spec', 'jest', 'mocha', 'vitest', 'cypress', 'playwright', 'unit test', 'integration', 'e2e', 'coverage', 'mock', 'stub', 'fixture', 'write test', 'add test'],
    relevantDirs: ['tests/', 'test/', '__tests__/', 'spec/', 'cypress/', 'e2e/'],
    relevantFiles: ['test', 'spec', 'mock', 'fixture', 'factory', 'helper'],
    requirements: [
      'Write meaningful test descriptions',
      'Cover edge cases',
      'Use appropriate test isolation',
      'Mock external dependencies'
    ],
    excludeContext: ['history'],
    priority: ['project', 'standards', 'testing', 'persona']
  },
  bugfix: {
    name: 'Bug Fix',
    patterns: ['fix', 'bug', 'issue', 'problem', 'error', 'crash', 'broken', 'not working', 'fails', 'debug', 'patch', 'hotfix'],
    relevantDirs: [],  // Bug fixes can be anywhere
    relevantFiles: [],
    requirements: [
      'Identify root cause before fixing',
      'Add regression tests',
      'Document the fix',
      'Consider edge cases'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'latest_commit', 'history', 'persona']
  },
  performance: {
    name: 'Performance',
    patterns: ['performance', 'optimize', 'speed', 'slow', 'fast', 'cache', 'lazy', 'bundle', 'minify', 'compress', 'memory', 'profile', 'benchmark'],
    relevantDirs: ['src/', 'lib/', 'utils/'],
    relevantFiles: ['cache', 'optimize', 'performance', 'bundle', 'config'],
    requirements: [
      'Measure before and after optimization',
      'Use appropriate caching strategies',
      'Avoid premature optimization',
      'Consider trade-offs'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'architecture', 'persona']
  },
  refactor: {
    name: 'Refactoring',
    patterns: ['refactor', 'clean', 'improve', 'restructure', 'reorganize', 'simplify', 'deduplicate', 'extract', 'rename'],
    relevantDirs: [],
    relevantFiles: [],
    requirements: [
      'Ensure tests pass before and after',
      'Make incremental changes',
      'Preserve existing behavior',
      'Document significant changes'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'architecture', 'persona']
  },
  deploy: {
    name: 'Deployment',
    patterns: ['deploy', 'deployment', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes', 'k8s', 'vercel', 'netlify', 'heroku', 'aws', 'production', 'staging'],
    relevantDirs: ['.github/', 'deploy/', 'docker/', 'k8s/', 'scripts/', 'infra/'],
    relevantFiles: ['dockerfile', 'docker-compose', 'workflow', 'pipeline', 'deploy', 'config'],
    requirements: [
      'Validate environment configuration',
      'Test deployment process',
      'Ensure rollback capability',
      'Check security settings'
    ],
    excludeContext: [],
    priority: ['project', 'standards', 'deployment', 'persona']
  }
};

/**
 * Detect task type from intent
 * @param {string|Object} intent - Intent string or parsed intent object
 * @returns {{ type: string, confidence: number, config: Object }}
 */
function detectTaskType(intent) {
  const text = typeof intent === 'string' ? intent.toLowerCase() : (intent.raw || '').toLowerCase();

  let bestMatch = null;
  let highestScore = 0;

  for (const [typeName, config] of Object.entries(TASK_TYPES)) {
    const score = calculateTypeScore(text, config.patterns);

    if (score > highestScore) {
      highestScore = score;
      bestMatch = typeName;
    }
  }

  // Return match if score is above threshold
  if (bestMatch && highestScore >= 0.5) {
    return {
      type: bestMatch,
      confidence: highestScore,
      config: TASK_TYPES[bestMatch]
    };
  }

  // Default to general type
  return {
    type: 'general',
    confidence: 0,
    config: {
      name: 'General',
      patterns: [],
      relevantDirs: [],
      relevantFiles: [],
      requirements: [],
      excludeContext: [],
      priority: ['project', 'standards', 'persona']
    }
  };
}

/**
 * Calculate match score for task type
 * @param {string} text - Text to match
 * @param {string[]} patterns - Patterns to match against
 * @returns {number} - Score between 0 and 1
 */
function calculateTypeScore(text, patterns) {
  if (patterns.length === 0) return 0;

  let matches = 0;
  let strongMatch = false;

  for (const pattern of patterns) {
    if (text.includes(pattern)) {
      matches++;
      // Strong patterns that definitively identify the task type
      if (pattern.length > 4) {
        strongMatch = true;
      }
    }
  }

  if (matches === 0) return 0;

  // Strong match gives higher base score
  const baseScore = strongMatch ? 0.7 : (matches / patterns.length);
  const multiMatchBonus = matches > 1 ? 0.2 : 0;

  return Math.min(baseScore + multiMatchBonus, 1);
}

/**
 * Get task-specific requirements
 * @param {string} taskType - Task type name
 * @param {string} subType - Optional sub-type for more specific requirements
 * @returns {string[]}
 */
function getTaskRequirements(taskType, subType = null) {
  const config = TASK_TYPES[taskType];
  if (!config) return [];

  return config.requirements || [];
}

/**
 * Get relevant paths for a task type
 * @param {string} taskType - Task type name
 * @returns {{ dirs: string[], files: string[] }}
 */
function getRelevantPaths(taskType) {
  const config = TASK_TYPES[taskType];
  if (!config) {
    return { dirs: [], files: [] };
  }

  return {
    dirs: config.relevantDirs || [],
    files: config.relevantFiles || []
  };
}

/**
 * Check if a context type should be included for the task
 * @param {string} taskType - Task type name
 * @param {string} contextName - Context file name
 * @returns {boolean}
 */
function shouldIncludeContext(taskType, contextName) {
  const config = TASK_TYPES[taskType];
  if (!config) return true;

  // Check if context is explicitly excluded
  if (config.excludeContext && config.excludeContext.includes(contextName)) {
    return false;
  }

  return true;
}

/**
 * Get context priority order for task type
 * @param {string} taskType - Task type name
 * @returns {string[]}
 */
function getContextPriority(taskType) {
  const config = TASK_TYPES[taskType];
  if (!config) {
    return ['project', 'standards', 'persona'];
  }

  return config.priority || ['project', 'standards', 'persona'];
}

/**
 * Get all available task types
 * @returns {Object}
 */
function getAllTaskTypes() {
  return TASK_TYPES;
}

/**
 * Get task type info by name
 * @param {string} typeName - Task type name
 * @returns {Object|null}
 */
function getTaskTypeInfo(typeName) {
  return TASK_TYPES[typeName] || null;
}

module.exports = {
  detectTaskType,
  getTaskRequirements,
  getRelevantPaths,
  shouldIncludeContext,
  getContextPriority,
  getAllTaskTypes,
  getTaskTypeInfo,
  TASK_TYPES
};
