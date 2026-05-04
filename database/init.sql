-- Legacy manual PostgreSQL bootstrap reference.
-- New installations should prefer EF Core migrations from api-gateway/Migrations.
-- This file is kept only for historical comparison and emergency reference.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emotion history table
CREATE TABLE IF NOT EXISTS emotion_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    guest_session_id TEXT,
    detected_emotion VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.0,
    explanation TEXT,
    image_path TEXT,
    user_text TEXT,
    modality_used VARCHAR(32) NOT NULL DEFAULT 'multimodal',
    model_used VARCHAR(64) NOT NULL DEFAULT 'gemini-multimodal',
    response_time_ms INTEGER,
    face_detected BOOLEAN NOT NULL DEFAULT FALSE,
    CHECK (user_id IS NOT NULL OR guest_session_id IS NOT NULL),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recommendations table
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    history_id UUID NOT NULL REFERENCES emotion_history(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL CHECK (category IN ('music', 'movie', 'book', 'advice')),
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table
CREATE TABLE IF NOT EXISTS analysis_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    history_id UUID NOT NULL UNIQUE REFERENCES emotion_history(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_session_id TEXT,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    analysis_accuracy_rating INTEGER NOT NULL CHECK (analysis_accuracy_rating BETWEEN 1 AND 5),
    recommendation_quality_rating INTEGER NOT NULL CHECK (recommendation_quality_rating BETWEEN 1 AND 5),
    helpful BOOLEAN NOT NULL DEFAULT FALSE,
    would_reuse BOOLEAN NOT NULL DEFAULT FALSE,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_emotion_history_user_id ON emotion_history(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_history_guest_session_id ON emotion_history(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_history_created_at ON emotion_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_history_id ON recommendations(history_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_category ON recommendations(category);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_user_id ON analysis_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_guest_session_id ON analysis_feedback(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_created_at ON analysis_feedback(created_at DESC);
