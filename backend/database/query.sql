-- ========================================================
-- DDL SETUP FOR H.O.L.M.E.V. VECTOR MEMORY
-- ========================================================

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Define Cosine Distance indexes for memory searching
-- <=> is the Cosine Distance operator in pgvector
CREATE INDEX IF NOT EXISTS memory_logs_embedding_cosine_idx 
ON memory_logs 
USING hnsw (embedding vector_cosine_ops);

-- Define Cosine Distance indexes for face recognition
CREATE INDEX IF NOT EXISTS user_identities_face_embedding_cosine_idx 
ON user_identities 
USING hnsw (face_embedding vector_cosine_ops);

-- ========================================================
-- 1. K-NEAREST NEIGHBOR (KNN) TEXT MEMORY RETRIEVAL
-- ========================================================
-- Calculates cosine similarity as (1 - distance).
-- Filters matches below 0.85 similarity.
-- $1 represents the input query text embedding (768 dimensions).
SELECT 
    id, 
    prompt_text, 
    metadata,
    1 - (embedding <=> $1) AS similarity 
FROM 
    memory_logs 
WHERE 
    1 - (embedding <=> $1) > 0.85 
ORDER BY 
    similarity DESC 
LIMIT 5;

-- ========================================================
-- 2. FACIAL RECOGNITION IDENTITY MATCHING
-- ========================================================
-- Matches an incoming 128-dimensional face embedding ($1)
-- with known user identities in the database.
SELECT 
    id, 
    user_name, 
    security_clearance_level,
    last_seen,
    1 - (face_embedding <=> $1) AS match_confidence
FROM 
    user_identities 
WHERE 
    1 - (face_embedding <=> $1) > 0.90 
ORDER BY 
    match_confidence DESC 
LIMIT 1;
