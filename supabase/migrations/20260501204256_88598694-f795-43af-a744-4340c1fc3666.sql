
-- Add onboarding flag (other columns already exist)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Novo Projeto',
  thumbnail_url text,
  node_config jsonb,
  template text,
  format text DEFAULT 'feed-1-1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Generations
CREATE TABLE IF NOT EXISTS public.generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt_used text,
  format text,
  provider text,
  image_urls text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own generations" ON public.generations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own generations" ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own generations" ON public.generations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own generations" ON public.generations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_user ON public.generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_project ON public.generations(project_id);

-- Storage bucket for creatives & uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('creatives', 'creatives', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read creatives"
ON storage.objects FOR SELECT
USING (bucket_id = 'creatives');

CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'creatives' AND auth.uid()::text = (storage.foldername(name))[1]);
