/**
 * HisabKitab 360 - Vector Embeddings & Semantic Search Engine
 * Tip 15: pgvector Compatibility, Cosine Similarity & Natural Language Product Matching
 * --------------------------------------------------------------------------------------
 * Allows searching by semantic intent and context (e.g., searching "ঠান্ডা পানির বোতল"
 * matches "মিনারেল ওয়াটার", or "মাথাব্যথার ঔষধ" matches Paracetamol/Napa).
 */

// Basic semantic dictionary mapping for common business terms
const SEMANTIC_INTENT_CLUSTERS = {
  water_beverage: ['পানি', 'মিনারেল', 'কোমল পানীয়', 'জুস', 'কোল্ড ড্রিংকস', 'শরবত', 'কোকা কোলা', 'স্প্রাইট'],
  snack_bakery: ['বিস্কুট', 'চিপস', 'কেক', 'ট্রিট', 'টোস্ট', 'রুটি', 'পাউরুটি', 'চানাচুর'],
  medicine_fever: ['প্যারাসিটামল', 'নাপা', 'জ্বর', 'ঠান্ডা', 'মাথাব্যথা', 'এইস', 'অ্যান্টাসিড'],
  dairy_sweet: ['দুধ', 'মিষ্টি', 'দই', 'ঘি', 'মাখন', 'ছানা'],
  grocery_cooking: ['তেল', 'চাল', 'ডাল', 'লবণ', 'চিনি', 'পেঁয়াজ', 'রসুন', 'মরিচ', 'আটা', 'ময়দা'],
  toiletries: ['সাবান', 'শ্যাম্পু', 'টুথপেস্ট', 'সার্ফ এক্সেল', 'হুইল', 'ব্রাশ', 'ডিটারজেন্ট']
};

export const computeCosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const generatePseudoEmbedding = (text = '') => {
  const norm = text.toLowerCase().trim();
  const vector = new Array(16).fill(0);

  // Hash character code distributions into 16 dimensions
  for (let i = 0; i < norm.length; i++) {
    const code = norm.charCodeAt(i);
    const dim = (code + i) % 16;
    vector[dim] += Math.sin(code) * 0.5 + 0.5;
  }

  // Check intent cluster bonuses
  let clusterIdx = 0;
  for (const [cluster, keywords] of Object.entries(SEMANTIC_INTENT_CLUSTERS)) {
    const hasMatch = keywords.some(k => norm.includes(k));
    if (hasMatch) {
      vector[clusterIdx % 16] += 2.5;
    }
    clusterIdx++;
  }

  // Normalize unit vector
  let sumSq = 0;
  for (let v of vector) sumSq += v * v;
  const mag = Math.sqrt(sumSq) || 1;
  return vector.map(v => Number((v / mag).toFixed(4)));
};

export const searchSemanticVector = (query = '', products = [], threshold = 0.55) => {
  if (!query || !query.trim()) return products;
  const queryEmbedding = generatePseudoEmbedding(query);

  const scored = [];
  for (const prod of products) {
    const prodText = `${prod.name || ''} ${prod.category || ''} ${prod.description || ''}`;
    const prodEmbedding = generatePseudoEmbedding(prodText);
    const sim = computeCosineSimilarity(queryEmbedding, prodEmbedding);

    if (sim >= threshold) {
      scored.push({ product: prod, similarity: sim });
    }
  }

  scored.sort((a, b) => b.similarity - a.similarity);
  return scored.map(s => s.product);
};

export const generatePgVectorSql = () => {
  return `-- =========================================================================
-- HISABKITAB 360 - SEMANTIC SEARCH & VECTOR EMBEDDINGS (pgvector)
-- =========================================================================

-- ১. pgvector এক্সটেনশন সক্রিয় করা
CREATE EXTENSION IF NOT EXISTS vector;

-- ২. প্রোডাক্ট টেবিলে এম্বেডিং কলাম যোগ করা (1536 dimensions for OpenAI or 384 for MiniLM)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS embedding vector(384);

-- ৩. উচ্চ গতির HNSW ইনডেক্স তৈরি (Cosine Distance)
CREATE INDEX IF NOT EXISTS idx_products_embedding_hnsw 
ON products USING hnsw (embedding vector_cosine_ops);

-- ৪. সিম্যান্টিক ন্যাচারাল ল্যাঙ্গুয়েজ সার্চ RPC ফাংশন
CREATE OR REPLACE FUNCTION match_products_semantic(
    query_embedding vector(384),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    barcode TEXT,
    price NUMERIC,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.name,
        p.barcode,
        p.price,
        1 - (p.embedding <=> query_embedding) AS similarity
    FROM products p
    WHERE 1 - (p.embedding <=> query_embedding) > match_threshold
    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
`;
};

export const semanticVectorSearchService = {
  search: searchSemanticVector,
  generateEmbedding: generatePseudoEmbedding,
  cosineSimilarity: computeCosineSimilarity,
  generateSql: generatePgVectorSql
};

export default semanticVectorSearchService;
