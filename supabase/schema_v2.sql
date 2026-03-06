-- SpineOS Schema v2 — Proper relational schema for production
-- Run this in Supabase SQL Editor AFTER backing up existing data

-- ============================================
-- User Profiles (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'surgeon' CHECK (role IN ('surgeon', 'biller', 'admin')),
  practice_id UUID,
  display_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_practice ON user_profiles(practice_id);

-- ============================================
-- User Invites
-- ============================================
CREATE TABLE IF NOT EXISTS user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'biller' CHECK (role IN ('surgeon', 'biller', 'admin')),
  invited_by UUID REFERENCES auth.users(id),
  practice_id UUID,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Cases (the core unit of work)
-- ============================================
CREATE TABLE IF NOT EXISTS cases_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_id UUID,
  submitted_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  op_note_text TEXT NOT NULL,
  procedure_date DATE DEFAULT CURRENT_DATE,
  patient_id_hash TEXT,  -- hashed patient identifier, never store raw PHI
  diagnosis TEXT DEFAULT '',
  levels TEXT[] DEFAULT '{}',
  approach TEXT DEFAULT '',
  payer TEXT DEFAULT 'Medicare',
  facility TEXT DEFAULT 'hospital' CHECK (facility IN ('hospital', 'ASC')),
  status TEXT DEFAULT 'pending_coding' CHECK (status IN (
    'pending_coding',   -- submitted, waiting for AI analysis
    'pending_review',   -- AI coded, waiting for biller review
    'finalized',        -- biller approved/edited, ready for submission
    'rejected',         -- biller rejected, needs surgeon attention
    'submitted'         -- sent to payer
  )),
  total_wrvu NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_v2_status ON cases_v2(status);
CREATE INDEX IF NOT EXISTS idx_cases_v2_submitted_by ON cases_v2(submitted_by);
CREATE INDEX IF NOT EXISTS idx_cases_v2_practice ON cases_v2(practice_id);
CREATE INDEX IF NOT EXISTS idx_cases_v2_date ON cases_v2(procedure_date);

-- ============================================
-- Coding Results (AI output per case, versioned)
-- ============================================
CREATE TABLE IF NOT EXISTS coding_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases_v2(id) ON DELETE CASCADE,
  engine_version TEXT NOT NULL DEFAULT '2.0.0',
  cpt_codes JSONB NOT NULL DEFAULT '[]',
  icd10_codes JSONB NOT NULL DEFAULT '[]',
  confidence NUMERIC(5,2) DEFAULT 0,
  raw_response JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_results_case ON coding_results(case_id);

-- ============================================
-- Coding Reviews (biller actions on AI results)
-- ============================================
CREATE TABLE IF NOT EXISTS coding_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coding_result_id UUID REFERENCES coding_results(id),
  case_id UUID NOT NULL REFERENCES cases_v2(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL CHECK (action IN ('approve', 'edit', 'reject')),
  original_codes JSONB,
  final_codes JSONB,
  review_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coding_reviews_case ON coding_reviews(case_id);
CREATE INDEX IF NOT EXISTS idx_coding_reviews_reviewer ON coding_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_coding_reviews_action ON coding_reviews(action);

-- ============================================
-- Training Signals (keep existing, add structure)
-- ============================================
-- Using existing training_signals table from schema v1
-- No changes needed - payload JSONB is flexible enough

-- ============================================
-- Audit Log
-- ============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE coding_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- User profiles: users can read their own, service role can read all
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Cases: users in same practice can see all cases
CREATE POLICY "Users can read practice cases" ON cases_v2
  FOR SELECT USING (
    submitted_by = auth.uid()
    OR assigned_to = auth.uid()
    OR practice_id IN (SELECT practice_id FROM user_profiles WHERE id = auth.uid())
  );
CREATE POLICY "Users can insert cases" ON cases_v2
  FOR INSERT WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Users can update accessible cases" ON cases_v2
  FOR UPDATE USING (
    submitted_by = auth.uid()
    OR assigned_to = auth.uid()
    OR practice_id IN (SELECT practice_id FROM user_profiles WHERE id = auth.uid())
  );

-- Coding results: readable by anyone who can see the case
CREATE POLICY "Users can read coding results" ON coding_results
  FOR SELECT USING (
    case_id IN (SELECT id FROM cases_v2 WHERE
      submitted_by = auth.uid()
      OR assigned_to = auth.uid()
      OR practice_id IN (SELECT practice_id FROM user_profiles WHERE id = auth.uid())
    )
  );

-- Reviews: same access as cases
CREATE POLICY "Users can read reviews" ON coding_reviews
  FOR SELECT USING (
    case_id IN (SELECT id FROM cases_v2 WHERE
      submitted_by = auth.uid()
      OR assigned_to = auth.uid()
      OR practice_id IN (SELECT practice_id FROM user_profiles WHERE id = auth.uid())
    )
  );
CREATE POLICY "Users can insert reviews" ON coding_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Audit log: only own entries (admins use service role for full access)
CREATE POLICY "Users can read own audit entries" ON audit_log
  FOR SELECT USING (user_id = auth.uid());

-- ============================================
-- Auto-assign role from invite on signup
-- (Supabase function triggered on auth.users insert)
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Check if there's an invite for this email
  SELECT * INTO invite_record FROM user_invites
    WHERE email = LOWER(NEW.email) AND accepted_at IS NULL
    LIMIT 1;

  IF invite_record IS NOT NULL THEN
    -- Create profile with invited role
    INSERT INTO user_profiles (id, email, role, practice_id, display_name)
    VALUES (NEW.id, NEW.email, invite_record.role, invite_record.practice_id, SPLIT_PART(NEW.email, '@', 1));

    -- Mark invite as accepted
    UPDATE user_invites SET accepted_at = NOW() WHERE id = invite_record.id;
  ELSE
    -- Default: create as surgeon
    INSERT INTO user_profiles (id, email, role, display_name)
    VALUES (NEW.id, NEW.email, 'surgeon', SPLIT_PART(NEW.email, '@', 1));
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
