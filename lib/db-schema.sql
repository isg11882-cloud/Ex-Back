-- 1. 유저 프로필 테이블
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT,
  total_points INTEGER DEFAULT 0,
  chat_count INTEGER DEFAULT 0,
  current_phase INTEGER DEFAULT 1,
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 진단 결과 테이블
CREATE TABLE IF NOT EXISTS public.diagnosis_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  breakup_type TEXT NOT NULL,
  phase INTEGER NOT NULL,
  title TEXT,
  summary TEXT,
  success_rate TEXT,
  days_since_breakup INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 상담 내역 테이블
CREATE TABLE IF NOT EXISTS public.chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  content TEXT NOT NULL,
  is_error BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 미션 관리 테이블
CREATE TABLE IF NOT EXISTS public.user_missions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  mission_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'completed')) DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 보안 규칙 (Row Level Security) 설정
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnosis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;

-- 내 데이터만 볼 수 있게 허용하는 정책 (Policies)
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own diagnosis" ON public.diagnosis_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own diagnosis" ON public.diagnosis_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chat history" ON public.chat_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own chat history" ON public.chat_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own missions" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own missions" ON public.user_missions FOR ALL USING (auth.uid() = user_id);
