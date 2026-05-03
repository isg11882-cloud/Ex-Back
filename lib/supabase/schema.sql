-- ──────────────────────────────────────────────────
-- 재회컨설팅 앱 Supabase 스키마
-- Supabase Dashboard > SQL Editor 에서 실행
-- ──────────────────────────────────────────────────

-- 사용자 프로필 (auth.users 확장)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 기본 정보
  nickname TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),

  -- 진단 결과
  breakup_type TEXT CHECK (breakup_type IN ('A', 'B', 'C', 'D')),
  days_since_breakup INTEGER DEFAULT 0,
  breakup_date DATE,
  current_phase INTEGER DEFAULT 1 CHECK (current_phase IN (1, 2, 3)),
  diagnosis_scores JSONB DEFAULT '{"A":0,"B":0,"C":0,"D":0}',

  -- 현황 메모 (AI 컨텍스트에 활용)
  situation_memo TEXT,

  -- 게임화
  total_points INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_active_date DATE,

  -- 설정
  push_enabled BOOLEAN DEFAULT TRUE,
  consultation_count INTEGER DEFAULT 0
);

-- 미션 완료 기록
CREATE TABLE mission_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),

  mission_id TEXT NOT NULL,        -- M001 ~ M108
  mission_title TEXT NOT NULL,
  mission_phase INTEGER NOT NULL,
  mission_category TEXT NOT NULL,
  points_earned INTEGER NOT NULL,
  note TEXT                         -- 사용자 메모
);

-- AI 상담 대화 기록
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  breakup_type TEXT,
  phase INTEGER,
  days_since_breakup INTEGER,
  mission_recommended JSONB        -- 추천된 미션 데이터
);

-- 감정 체크인 (홈 화면 감정 기록)
CREATE TABLE emotion_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT NOW(),

  emotion_score INTEGER CHECK (emotion_score BETWEEN 1 AND 10),
  emotion_label TEXT,              -- '매우 힘듦' ~ '많이 좋아짐'
  note TEXT
);

-- 뱃지 (업적)
CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),

  badge_id TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_emoji TEXT
);

-- ──────────────────────────────────────────────────
-- RLS (Row Level Security) 정책
-- ──────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- 본인 데이터만 접근 가능
CREATE POLICY "users_own_profile" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "users_own_missions" ON mission_completions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_conversations" ON conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_emotions" ON emotion_checkins FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users_own_badges" ON user_badges FOR ALL USING (auth.uid() = user_id);

-- 신규 가입 시 profiles 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
