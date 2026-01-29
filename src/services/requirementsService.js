/**
 * Requirements Service
 *
 * Provides task-specific requirements and checklists.
 * Injects relevant requirements based on task type.
 */

/**
 * Task-specific requirements database
 */
const REQUIREMENTS_DB = {
  seo: {
    openGraph: [
      'og:title - Page title (max 60 chars)',
      'og:description - Summary (max 155 chars)',
      'og:image - Preview image (1200x630px recommended)',
      'og:url - Canonical URL',
      'og:type - Content type (website, article, product, etc.)',
      'og:site_name - Website name',
      'og:locale - Language/region (e.g., en_US)'
    ],
    twitterCard: [
      'twitter:card - Card type (summary, summary_large_image)',
      'twitter:site - @username of website',
      'twitter:creator - @username of content creator',
      'twitter:title - Title for card',
      'twitter:description - Description for card',
      'twitter:image - Image URL for card'
    ],
    general: [
      'title tag - Unique, descriptive (50-60 chars)',
      'meta description - Compelling summary (150-160 chars)',
      'canonical URL - Prevent duplicate content',
      'robots meta - Control indexing behavior',
      'structured data - Schema.org markup'
    ]
  },
  api: {
    rest: [
      'Use appropriate HTTP methods (GET, POST, PUT, PATCH, DELETE)',
      'Return proper status codes (200, 201, 400, 401, 403, 404, 500)',
      'Include consistent error response format',
      'Add request body validation',
      'Implement proper error handling',
      'Document endpoints with OpenAPI/Swagger'
    ],
    security: [
      'Implement authentication (JWT, OAuth, etc.)',
      'Add rate limiting',
      'Validate and sanitize all inputs',
      'Use HTTPS in production',
      'Implement CORS properly'
    ],
    performance: [
      'Add pagination for list endpoints',
      'Implement caching headers',
      'Use gzip compression',
      'Consider response field filtering'
    ]
  },
  auth: {
    password: [
      'Hash passwords with bcrypt or Argon2',
      'Enforce minimum password requirements',
      'Implement account lockout after failed attempts',
      'Use secure password reset flow'
    ],
    session: [
      'Use secure, HTTP-only cookies',
      'Implement session timeout',
      'Regenerate session ID on login',
      'Invalidate sessions on logout'
    ],
    jwt: [
      'Use strong secret key',
      'Set appropriate token expiration',
      'Implement refresh token rotation',
      'Store tokens securely (HTTP-only cookies)'
    ],
    general: [
      'Implement CSRF protection',
      'Log authentication events',
      'Handle authentication errors gracefully',
      'Consider multi-factor authentication'
    ]
  },
  ui: {
    accessibility: [
      'Add ARIA labels where needed',
      'Ensure keyboard navigation',
      'Maintain sufficient color contrast',
      'Provide alt text for images',
      'Use semantic HTML elements'
    ],
    responsive: [
      'Use mobile-first approach',
      'Test on multiple screen sizes',
      'Use relative units (rem, em, %)',
      'Consider touch targets for mobile'
    ],
    general: [
      'Follow component design patterns',
      'Use consistent styling',
      'Handle loading and error states',
      'Implement proper form validation feedback'
    ]
  },
  database: {
    security: [
      'Use parameterized queries (prevent SQL injection)',
      'Encrypt sensitive data at rest',
      'Implement proper access controls',
      'Avoid storing sensitive data unnecessarily'
    ],
    performance: [
      'Add indexes for frequently queried columns',
      'Use connection pooling',
      'Implement query caching where appropriate',
      'Consider pagination for large result sets'
    ],
    reliability: [
      'Use database transactions for multi-step operations',
      'Implement proper error handling',
      'Add database migrations for schema changes',
      'Set up regular backups'
    ]
  },
  testing: {
    unit: [
      'Test individual functions in isolation',
      'Mock external dependencies',
      'Cover edge cases and error conditions',
      'Aim for meaningful coverage, not 100%'
    ],
    integration: [
      'Test component interactions',
      'Use realistic test data',
      'Clean up test state after each test',
      'Test error handling paths'
    ],
    e2e: [
      'Test critical user flows',
      'Use stable selectors (data-testid)',
      'Handle async operations properly',
      'Run in CI/CD pipeline'
    ]
  },
  performance: {
    frontend: [
      'Minimize bundle size',
      'Implement code splitting',
      'Use lazy loading for images',
      'Optimize critical rendering path',
      'Cache static assets'
    ],
    backend: [
      'Profile before optimizing',
      'Implement caching strategies',
      'Optimize database queries',
      'Use async operations where appropriate',
      'Consider horizontal scaling'
    ]
  },
  deploy: {
    general: [
      'Use environment variables for configuration',
      'Implement health check endpoints',
      'Set up proper logging',
      'Configure error monitoring',
      'Test rollback procedures'
    ],
    docker: [
      'Use multi-stage builds',
      'Minimize image size',
      'Run as non-root user',
      'Set resource limits',
      'Use specific version tags'
    ],
    ci: [
      'Run tests before deployment',
      'Use staging environment',
      'Implement gradual rollouts',
      'Automate deployment process'
    ]
  }
};

/**
 * Get requirements for a task type
 * @param {string} taskType - Task type name
 * @param {string|string[]} subTypes - Optional sub-types for specific requirements
 * @returns {string[]}
 */
function getRequirements(taskType, subTypes = null) {
  const typeRequirements = REQUIREMENTS_DB[taskType];
  if (!typeRequirements) {
    return [];
  }

  // If no sub-types specified, return general requirements if available
  if (!subTypes) {
    return typeRequirements.general || Object.values(typeRequirements).flat().slice(0, 5);
  }

  // Handle single sub-type or array of sub-types
  const subTypeArray = Array.isArray(subTypes) ? subTypes : [subTypes];
  const requirements = [];

  for (const subType of subTypeArray) {
    if (typeRequirements[subType]) {
      requirements.push(...typeRequirements[subType]);
    }
  }

  // Add general requirements if available
  if (typeRequirements.general && !subTypeArray.includes('general')) {
    requirements.push(...typeRequirements.general);
  }

  return [...new Set(requirements)]; // Remove duplicates
}

/**
 * Format requirements as a markdown section
 * @param {string[]} requirements - Requirements to format
 * @param {Object} options - Formatting options
 * @returns {string}
 */
function formatRequirementsSection(requirements, options = {}) {
  const {
    title = 'Task Requirements',
    showCheckboxes = false,
    maxItems = 10
  } = options;

  if (!requirements || requirements.length === 0) {
    return '';
  }

  const items = requirements.slice(0, maxItems);
  const prefix = showCheckboxes ? '- [ ] ' : '- ';

  const lines = items.map(req => prefix + req);

  if (requirements.length > maxItems) {
    lines.push(`\n_... and ${requirements.length - maxItems} more requirements_`);
  }

  return `## ${title}\n\n${lines.join('\n')}`;
}

/**
 * Inject requirements into prompt content
 * @param {string} promptContent - Original prompt content
 * @param {string} taskType - Task type
 * @param {Object} options - Injection options
 * @returns {string}
 */
function injectRequirements(promptContent, taskType, options = {}) {
  const requirements = getRequirements(taskType, options.subTypes);

  if (requirements.length === 0) {
    return promptContent;
  }

  const section = formatRequirementsSection(requirements, {
    title: options.title || `${capitalize(taskType)} Requirements`,
    ...options
  });

  // Insert before the Task section if it exists
  const taskSectionPattern = /\n## Task\n/;
  if (taskSectionPattern.test(promptContent)) {
    return promptContent.replace(taskSectionPattern, `\n\n${section}\n\n## Task\n`);
  }

  // Otherwise append before the end
  return `${promptContent}\n\n${section}`;
}

/**
 * Detect sub-types from intent
 * @param {string} intent - Intent string
 * @param {string} taskType - Detected task type
 * @returns {string[]}
 */
function detectSubTypes(intent, taskType) {
  const lowerIntent = intent.toLowerCase();
  const subTypes = [];

  const subTypePatterns = {
    seo: {
      openGraph: ['open graph', 'og:', 'opengraph', 'og tag'],
      twitterCard: ['twitter card', 'twitter:', 'tweet card'],
      general: ['meta', 'seo', 'search engine']
    },
    api: {
      rest: ['rest', 'api', 'endpoint', 'route'],
      security: ['auth', 'secure', 'token', 'jwt'],
      performance: ['cache', 'performance', 'fast']
    },
    auth: {
      password: ['password', 'hash', 'bcrypt'],
      session: ['session', 'cookie'],
      jwt: ['jwt', 'token', 'bearer']
    },
    testing: {
      unit: ['unit test', 'unit'],
      integration: ['integration', 'component test'],
      e2e: ['e2e', 'end to end', 'cypress', 'playwright']
    }
  };

  const patterns = subTypePatterns[taskType];
  if (!patterns) return subTypes;

  for (const [subType, keywords] of Object.entries(patterns)) {
    if (keywords.some(keyword => lowerIntent.includes(keyword))) {
      subTypes.push(subType);
    }
  }

  return subTypes;
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string}
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get all available requirement categories
 * @returns {Object}
 */
function getAllRequirementCategories() {
  return Object.keys(REQUIREMENTS_DB).reduce((acc, type) => {
    acc[type] = Object.keys(REQUIREMENTS_DB[type]);
    return acc;
  }, {});
}

module.exports = {
  getRequirements,
  formatRequirementsSection,
  injectRequirements,
  detectSubTypes,
  getAllRequirementCategories,
  REQUIREMENTS_DB
};
