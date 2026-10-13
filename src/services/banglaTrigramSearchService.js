/**
 * HisabKitab 360 - Bangla Trigram & Typo-Tolerant Search Engine
 * Tip 14: Fuzzy Search, Trigram Similarity & Bengali Phonetic Normalization
 * ------------------------------------------------------------------------
 * Emulates PostgreSQL pg_trgm extension client-side and interfaces with
 * pg_trgm in Supabase. Handles common Bengali typos (ণ/ন, শ/ষ/স, ই/ঈ, ড়/ঢ়/র, জ/য)
 * to provide instant, typo-forgiving search for products and customer names.
 */

// Bengali phonetic character normalization map
const BANGLA_CHAR_MAP = {
  'ণ': 'ন',
  'ষ': 'শ',
  'স': 'শ',
  'ঈ': 'ই',
  'ী': 'ি',
  'ঊ': 'উ',
  'ূ': 'ু',
  'ঢ়': 'র',
  'ড়': 'র',
  'য': 'জ',
  'ৎ': 'ত',
  'ঃ': '',
  'ঁ': ''
};

export const normalizeBanglaPhonetics = (text = '') => {
  if (!text || typeof text !== 'string') return '';
  let normalized = text.trim().toLowerCase();
  for (const [target, replacement] of Object.entries(BANGLA_CHAR_MAP)) {
    normalized = normalized.split(target).join(replacement);
  }
  return normalized;
};

export const generateTrigrams = (text = '') => {
  if (!text) return new Set();
  const normalized = `  ${text.toLowerCase().trim()}  `;
  const trigrams = new Set();
  for (let i = 0; i < normalized.length - 2; i++) {
    trigrams.add(normalized.substring(i, i + 3));
  }
  return trigrams;
};

export const calculateTrigramSimilarity = (strA = '', strB = '') => {
  if (!strA || !strB) return 0;
  if (strA === strB) return 1.0;

  const trigramsA = generateTrigrams(normalizeBanglaPhonetics(strA));
  const trigramsB = generateTrigrams(normalizeBanglaPhonetics(strB));

  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;

  let intersectionCount = 0;
  trigramsA.forEach(tri => {
    if (trigramsB.has(tri)) intersectionCount++;
  });

  const unionCount = trigramsA.size + trigramsB.size - intersectionCount;
  return unionCount > 0 ? intersectionCount / unionCount : 0;
};

export const searchBanglaFuzzy = (query = '', items = [], searchKeys = ['name', 'barcode', 'phone'], threshold = 0.25) => {
  if (!query || !query.trim()) return items;
  const qNorm = normalizeBanglaPhonetics(query.trim());
  const qTrigrams = generateTrigrams(qNorm);

  const scoredItems = [];

  for (const item of items) {
    let bestScore = 0;
    let matchedField = '';

    for (const key of searchKeys) {
      const val = item[key];
      if (!val || typeof val !== 'string') continue;

      const valNorm = normalizeBanglaPhonetics(val);

      // Exact substring match bonus
      if (valNorm.includes(qNorm)) {
        const score = 0.8 + (qNorm.length / valNorm.length) * 0.2;
        if (score > bestScore) {
          bestScore = score;
          matchedField = key;
        }
        continue;
      }

      // Trigram fuzzy match
      const valTrigrams = generateTrigrams(valNorm);
      let intersection = 0;
      qTrigrams.forEach(tri => {
        if (valTrigrams.has(tri)) intersection++;
      });
      const union = qTrigrams.size + valTrigrams.size - intersection;
      const score = union > 0 ? intersection / union : 0;

      if (score > bestScore) {
        bestScore = score;
        matchedField = key;
      }
    }

    if (bestScore >= threshold) {
      scoredItems.push({ item, score: bestScore, matchedField });
    }
  }

  scoredItems.sort((a, b) => b.score - a.score);
  return scoredItems.map(res => res.item);
};

export const generatePostgresTrgmSql = () => {
  return `-- =========================================================================
-- HISABKITAB 360 - BANGLA & MULTI-LINGUAL TRIGRAM FUZZY SEARCH (pg_trgm)
-- =========================================================================

-- ১. pg_trgm এক্সটেনশন চালু করা
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ২. পণ্য ও কাস্টমার টেবিলের জন্য GIN Trigram ইনডেক্স তৈরি
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm ON customers USING GIN (phone gin_trgm_ops);

-- ৩. বাংলা বানান সহনশীল (Typo-Tolerant) সার্চ ফাংশন
CREATE OR REPLACE FUNCTION search_products_fuzzy(
    p_organization_id UUID,
    p_query TEXT,
    p_limit INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    barcode TEXT,
    price NUMERIC,
    stock NUMERIC,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.barcode,
        p.price,
        p.stock,
        similarity(p.name, p_query) AS similarity
    FROM products p
    WHERE p.organization_id = p_organization_id
      AND (
          p.name % p_query 
          OR p.barcode ILIKE '%' || p_query || '%'
          OR p.name ILIKE '%' || p_query || '%'
      )
    ORDER BY similarity DESC, p.name ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
`;
};

export const banglaTrigramSearchService = {
  search: searchBanglaFuzzy,
  similarity: calculateTrigramSimilarity,
  normalizeBangla: normalizeBanglaPhonetics,
  generateTrigrams,
  generateSql: generatePostgresTrgmSql
};

export default banglaTrigramSearchService;
