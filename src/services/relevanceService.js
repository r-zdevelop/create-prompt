/**
 * Relevance Service
 *
 * Provides relevance scoring and filtering for context, commits, and files.
 * Uses keyword matching with synonym expansion for semantic understanding.
 */

/**
 * Synonym database for keyword expansion
 */
const SYNONYMS = {
  seo: ['meta', 'og:', 'open graph', 'opengraph', 'twitter card', 'sitemap', 'robots', 'canonical', 'metadata', 'search engine'],
  auth: ['login', 'logout', 'session', 'token', 'jwt', 'oauth', 'password', 'authentication', 'authorization', 'signin', 'signup', 'register', 'credential'],
  api: ['endpoint', 'route', 'rest', 'graphql', 'fetch', 'axios', 'request', 'response', 'controller', 'handler'],
  ui: ['component', 'button', 'modal', 'form', 'layout', 'style', 'css', 'design', 'interface', 'view', 'template', 'render'],
  database: ['query', 'migration', 'model', 'schema', 'prisma', 'mongoose', 'sql', 'mongodb', 'postgres', 'mysql', 'table', 'collection'],
  testing: ['test', 'spec', 'jest', 'mocha', 'unit', 'integration', 'e2e', 'coverage', 'assert', 'mock'],
  performance: ['optimize', 'cache', 'speed', 'lazy', 'bundle', 'minify', 'compress', 'memory', 'profil'],
  security: ['xss', 'csrf', 'injection', 'sanitize', 'escape', 'validate', 'encrypt', 'hash', 'secure'],
  config: ['configuration', 'settings', 'environment', 'env', 'dotenv', 'options', 'setup'],
  docs: ['documentation', 'readme', 'comment', 'jsdoc', 'typedoc', 'wiki', 'guide'],
  error: ['bug', 'fix', 'issue', 'problem', 'crash', 'exception', 'throw', 'catch', 'debug'],
  deploy: ['deployment', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes', 'vercel', 'netlify', 'heroku']
};

/**
 * Common word stems for matching variations
 */
const STEMS = {
  authenticat: ['authenticate', 'authentication', 'authenticating', 'authenticated'],
  optimi: ['optimize', 'optimization', 'optimizing', 'optimized', 'optimizer'],
  valid: ['validate', 'validation', 'validating', 'validated', 'validator'],
  config: ['config', 'configure', 'configuration', 'configuring', 'configured'],
  implement: ['implement', 'implementation', 'implementing', 'implemented'],
  generat: ['generate', 'generation', 'generating', 'generated', 'generator'],
  creat: ['create', 'creation', 'creating', 'created', 'creator'],
  updat: ['update', 'updating', 'updated', 'updater'],
  delet: ['delete', 'deletion', 'deleting', 'deleted'],
  render: ['render', 'rendering', 'rendered', 'renderer']
};

/**
 * Extract task keywords from intent string
 * @param {string|Object} intent - Intent string or parsed intent object
 * @returns {string[]} - Extracted keywords
 */
function extractTaskKeywords(intent) {
  const text = typeof intent === 'string' ? intent : intent.raw || '';
  const normalized = text.toLowerCase();

  // Split into words and filter stop words
  const words = normalized
    .split(/[\s,.\-_]+/)
    .filter(word => word.length > 2)
    .filter(word => !isStopWord(word));

  // Add multi-word phrases (e.g., "open graph", "twitter card")
  const phrases = extractPhrases(normalized);

  return [...new Set([...words, ...phrases])];
}

/**
 * Extract meaningful phrases from text
 * @param {string} text - Normalized text
 * @returns {string[]} - Extracted phrases
 */
function extractPhrases(text) {
  const phrases = [];
  const knownPhrases = [
    'open graph', 'twitter card', 'meta tags', 'dark mode', 'light mode',
    'drag and drop', 'file upload', 'form validation', 'error handling',
    'api endpoint', 'rest api', 'graphql api', 'user authentication',
    'password reset', 'email verification', 'two factor', '2fa'
  ];

  for (const phrase of knownPhrases) {
    if (text.includes(phrase)) {
      phrases.push(phrase);
    }
  }

  return phrases;
}

/**
 * Check if word is a stop word
 * @param {string} word - Word to check
 * @returns {boolean}
 */
function isStopWord(word) {
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'that', 'this', 'these',
    'those', 'it', 'its', 'my', 'your', 'our', 'their', 'i', 'me', 'we', 'us',
    'add', 'make', 'get', 'set', 'put', 'new', 'use', 'all', 'can', 'just'
  ]);
  return stopWords.has(word);
}

/**
 * Expand keywords with synonyms
 * @param {string[]} keywords - Keywords to expand
 * @returns {string[]} - Expanded keyword set
 */
function expandKeywords(keywords) {
  const expanded = new Set(keywords);

  for (const keyword of keywords) {
    // Check direct synonyms
    for (const [category, synonyms] of Object.entries(SYNONYMS)) {
      if (synonyms.includes(keyword) || keyword === category) {
        synonyms.forEach(syn => expanded.add(syn));
        expanded.add(category);
      }
    }

    // Check stems
    for (const [stem, variations] of Object.entries(STEMS)) {
      if (variations.includes(keyword) || keyword.startsWith(stem)) {
        variations.forEach(v => expanded.add(v));
      }
    }
  }

  return [...expanded];
}

/**
 * Score relevance of text against keywords
 * @param {string} text - Text to score
 * @param {string[]} keywords - Keywords to match
 * @param {Object} options - Scoring options
 * @returns {number} - Score between 0 and 1
 */
function scoreRelevance(text, keywords, options = {}) {
  const {
    expandSynonyms = true,
    caseSensitive = false,
    weights = { exact: 3, stem: 2, related: 1 }
  } = options;

  if (!text || !keywords || keywords.length === 0) {
    return 0;
  }

  const normalizedText = caseSensitive ? text : text.toLowerCase();
  const expandedKeywords = expandSynonyms ? expandKeywords(keywords) : keywords;

  let score = 0;
  let maxScore = 0;

  for (const keyword of keywords) {
    // Exact match (highest weight)
    if (normalizedText.includes(keyword)) {
      score += weights.exact;
    }
    maxScore += weights.exact;
  }

  // Check expanded keywords (lower weight)
  if (expandSynonyms) {
    for (const expanded of expandedKeywords) {
      if (!keywords.includes(expanded) && normalizedText.includes(expanded)) {
        score += weights.related;
      }
    }
    // Add potential max for expanded keywords (but cap the contribution)
    maxScore += Math.min(expandedKeywords.length * weights.related, keywords.length * weights.stem);
  }

  // Normalize to 0-1
  return maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
}

/**
 * Filter items by relevance score
 * @param {Array} items - Items to filter (each should have text or content property)
 * @param {string[]} keywords - Keywords to match
 * @param {Object} options - Filter options
 * @returns {Array} - Filtered and sorted items with scores
 */
function filterByRelevance(items, keywords, options = {}) {
  const {
    minScore = 0.3,
    maxItems = null,
    textExtractor = (item) => item.text || item.content || item.message || String(item),
    includeScores = true
  } = options;

  const scored = items.map(item => {
    const text = textExtractor(item);
    const score = scoreRelevance(text, keywords);
    return { item, score };
  });

  // Filter by minimum score
  let filtered = scored.filter(({ score }) => score >= minScore);

  // Sort by score (descending)
  filtered.sort((a, b) => b.score - a.score);

  // Limit items if specified
  if (maxItems && filtered.length > maxItems) {
    filtered = filtered.slice(0, maxItems);
  }

  // Return with or without scores
  return includeScores
    ? filtered
    : filtered.map(({ item }) => item);
}

/**
 * Check if content is relevant to task keywords
 * @param {string} content - Content to check
 * @param {string[]} keywords - Task keywords
 * @param {number} threshold - Minimum relevance threshold
 * @returns {boolean}
 */
function isRelevant(content, keywords, threshold = 0.3) {
  return scoreRelevance(content, keywords) >= threshold;
}

/**
 * Get relevance category based on score
 * @param {number} score - Relevance score
 * @returns {string} - Category: 'high', 'medium', 'low', 'none'
 */
function getRelevanceCategory(score) {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  if (score >= 0.2) return 'low';
  return 'none';
}

module.exports = {
  scoreRelevance,
  filterByRelevance,
  extractTaskKeywords,
  expandKeywords,
  isRelevant,
  getRelevanceCategory,
  SYNONYMS,
  STEMS
};
