-- ==============================================================================
-- EDUSTACK 2.0 — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ==============================================================================
-- Non-destructive migration: Safe for production, preserves existing student data.

-- 1. PROFILES TABLE (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TESTS METADATA TABLE (Code-managed questions, metadata in DB)
CREATE TABLE IF NOT EXISTS tests (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'JEE Main Full Mock Tests',
    duration_minutes INT NOT NULL DEFAULT 180,
    total_questions INT NOT NULL DEFAULT 75,
    total_marks INT NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ATTEMPTS TABLE (Independent Attempt Records)
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    test_id TEXT NOT NULL REFERENCES tests(id) ON DELETE RESTRICT,
    attempt_number INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED', 'EXPIRED')),
    score NUMERIC DEFAULT 0,
    accuracy NUMERIC DEFAULT 0,
    physics_score NUMERIC DEFAULT 0,
    chemistry_score NUMERIC DEFAULT 0,
    math_score NUMERIC DEFAULT 0,
    correct_count INT DEFAULT 0,
    wrong_count INT DEFAULT 0,
    unattempted_count INT DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    total_time_seconds INT DEFAULT 0,
    duration_minutes INT NOT NULL DEFAULT 180,
    is_error_correct_test BOOLEAN NOT NULL DEFAULT FALSE,
    parent_attempt_id UUID REFERENCES attempts(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce strictly that attempt numbers are sequential & unique per student + test
    CONSTRAINT uq_student_test_attempt UNIQUE (student_id, test_id, attempt_number)
);

-- 4. RESPONSES TABLE (Attempt-Scoped Question Responses)
CREATE TABLE IF NOT EXISTS responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    selected_option TEXT,
    numerical_value TEXT,
    marked_for_review BOOLEAN NOT NULL DEFAULT FALSE,
    visited BOOLEAN NOT NULL DEFAULT FALSE,
    time_spent_seconds INT NOT NULL DEFAULT 0,
    is_correct BOOLEAN,
    marks_awarded NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce uniqueness: Only 1 response record per question per attempt
    CONSTRAINT uq_attempt_question_response UNIQUE (attempt_id, question_id)
);

-- 5. ERROR NOTES TABLE (Attempt-Scoped Smart Error Notes with Multi-Classification Support)
CREATE TABLE IF NOT EXISTS error_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    error_types TEXT[] NOT NULL DEFAULT '{"CONCEPT_ERROR"}',
    error_type TEXT DEFAULT 'CONCEPT_ERROR', -- Backward compatibility
    student_explanation TEXT,
    correct_concept TEXT,
    correct_formula TEXT,
    prevention_note TEXT,
    solution_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Enforce uniqueness: 1 error note per question per attempt
    CONSTRAINT uq_attempt_question_error_note UNIQUE (attempt_id, question_id)
);

-- Backward compatibility migration trigger for existing error_notes table if already created
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'error_notes' AND column_name = 'error_types'
    ) THEN
        ALTER TABLE error_notes ADD COLUMN error_types TEXT[] DEFAULT '{"CONCEPT_ERROR"}';
        UPDATE error_notes SET error_types = ARRAY[error_type] WHERE error_type IS NOT NULL;
    END IF;
END $$;

-- ==============================================================================
-- REQUIRED INDEXES (Optimized for fast dashboard, analysis & attempt queries)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_attempts_student_test ON attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_parent ON attempts(parent_attempt_id);
CREATE INDEX IF NOT EXISTS idx_responses_attempt ON responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_error_notes_attempt ON error_notes(attempt_id);
CREATE INDEX IF NOT EXISTS idx_error_notes_student ON error_notes(student_id);

-- ==============================================================================
-- CONCURRENCY-SAFE ATTEMPT NUMBER GENERATOR
-- ==============================================================================
CREATE OR REPLACE FUNCTION create_next_attempt(
    p_student_id UUID,
    p_test_id TEXT,
    p_duration_minutes INT DEFAULT 180,
    p_is_error_correct_test BOOLEAN DEFAULT FALSE,
    p_parent_attempt_id UUID DEFAULT NULL
)
RETURNS TABLE (
    attempt_id UUID,
    attempt_number INT,
    started_at TIMESTAMPTZ
) AS $$
DECLARE
    v_next_num INT;
    v_attempt_id UUID;
    v_started_at TIMESTAMPTZ := NOW();
BEGIN
    -- Concurrency-safe lock strictly scoped to (student_id, test_id)
    SELECT COALESCE(MAX(a.attempt_number), 0) + 1
    INTO v_next_num
    FROM attempts a
    WHERE a.student_id = p_student_id AND a.test_id = p_test_id
    FOR UPDATE;

    INSERT INTO attempts (
        student_id,
        test_id,
        attempt_number,
        status,
        started_at,
        duration_minutes,
        is_error_correct_test,
        parent_attempt_id
    )
    VALUES (
        p_student_id,
        p_test_id,
        v_next_num,
        'IN_PROGRESS',
        v_started_at,
        p_duration_minutes,
        p_is_error_correct_test,
        p_parent_attempt_id
    )
    RETURNING id INTO v_attempt_id;

    RETURN QUERY SELECT v_attempt_id, v_next_num, v_started_at;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_notes ENABLE ROW LEVEL SECURITY;

-- Profiles: Students can read & update only their own profile
CREATE POLICY "Users can read own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Tests: Publicly readable for all authenticated students
CREATE POLICY "Authenticated users can read tests"
    ON tests FOR SELECT
    TO authenticated
    USING (true);

-- Attempts: Students can only read/insert/update their own attempts
CREATE POLICY "Users can read own attempts"
    ON attempts FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own attempts"
    ON attempts FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own attempts"
    ON attempts FOR UPDATE
    USING (auth.uid() = student_id);

-- Responses: Students can only access responses for their own attempts
CREATE POLICY "Users can read own responses"
    ON responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM attempts 
            WHERE attempts.id = responses.attempt_id 
            AND attempts.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own responses"
    ON responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM attempts 
            WHERE attempts.id = responses.attempt_id 
            AND attempts.student_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own responses"
    ON responses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM attempts 
            WHERE attempts.id = responses.attempt_id 
            AND attempts.student_id = auth.uid()
        )
    );

-- Error Notes: Students can only access their own error notes
CREATE POLICY "Users can read own error notes"
    ON error_notes FOR SELECT
    USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own error notes"
    ON error_notes FOR INSERT
    WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update own error notes"
    ON error_notes FOR UPDATE
    USING (auth.uid() = student_id);

CREATE POLICY "Users can delete own error notes"
    ON error_notes FOR DELETE
    USING (auth.uid() = student_id);
