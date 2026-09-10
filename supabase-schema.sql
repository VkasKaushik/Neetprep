-- NEET PREP Supabase Database Schema
-- Run this script in the Supabase SQL Editor to configure all tables, foreign keys, and Row Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  target_exam TEXT DEFAULT 'NEET 2027',
  exam_date DATE DEFAULT '2027-05-02',
  daily_study_goal NUMERIC DEFAULT 6.0,
  daily_question_goal INTEGER DEFAULT 200,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- 2. Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('Physics', 'Chemistry', 'Biology')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own subjects" ON public.subjects
  FOR ALL USING (auth.uid() = user_id);

-- 3. Chapters Table
CREATE TABLE IF NOT EXISTS public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own chapters" ON public.chapters
  FOR ALL USING (auth.uid() = user_id);

-- 4. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject_name TEXT NOT NULL,
  chapter_name TEXT,
  topic_name TEXT,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 45,
  priority TEXT NOT NULL DEFAULT 'Medium',
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);

-- 5. Study Sessions Table
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own study sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

-- 6. Question Logs Table
CREATE TABLE IF NOT EXISTS public.question_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  subject_name TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  incorrect INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.question_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own question logs" ON public.question_logs
  FOR ALL USING (auth.uid() = user_id);

-- 7. Tests Table
CREATE TABLE IF NOT EXISTS public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  physics_score INTEGER NOT NULL DEFAULT 0,
  chemistry_score INTEGER NOT NULL DEFAULT 0,
  biology_score INTEGER NOT NULL DEFAULT 0,
  maximum_marks INTEGER NOT NULL DEFAULT 720,
  correct INTEGER NOT NULL DEFAULT 0,
  incorrect INTEGER NOT NULL DEFAULT 0,
  unattempted INTEGER NOT NULL DEFAULT 0,
  time_taken INTEGER NOT NULL DEFAULT 180,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own tests" ON public.tests
  FOR ALL USING (auth.uid() = user_id);

-- 8. Weak Topics Table
CREATE TABLE IF NOT EXISTS public.weak_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_name TEXT NOT NULL,
  chapter_name TEXT,
  topic_name TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'High',
  status TEXT NOT NULL DEFAULT 'Needs Revision',
  last_studied DATE,
  next_revision DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own weak topics" ON public.weak_topics
  FOR ALL USING (auth.uid() = user_id);

-- 9. Revisions Table
CREATE TABLE IF NOT EXISTS public.revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  subject_name TEXT NOT NULL,
  chapter_name TEXT,
  initial_studied BOOLEAN DEFAULT FALSE,
  rev1_completed BOOLEAN DEFAULT FALSE,
  rev2_completed BOOLEAN DEFAULT FALSE,
  rev3_completed BOOLEAN DEFAULT FALSE,
  rev4_completed BOOLEAN DEFAULT FALSE,
  next_revision DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own revisions" ON public.revisions
  FOR ALL USING (auth.uid() = user_id);

-- 10. Reflections Table
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
  period TEXT NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reflections" ON public.reflections
  FOR ALL USING (auth.uid() = user_id);

-- Profile auto-creation trigger on new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'NEET Aspirant'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
