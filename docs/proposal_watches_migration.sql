-- "보고싶어요" 기능에 필요한 테이블입니다.
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 한 번 실행하세요.

CREATE TABLE IF NOT EXISTS public.proposal_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_proposal_watches_proposal
  ON public.proposal_watches (proposal_id);

ALTER TABLE public.proposal_watches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposal_watches_select" ON public.proposal_watches;
DROP POLICY IF EXISTS "proposal_watches_insert" ON public.proposal_watches;
DROP POLICY IF EXISTS "proposal_watches_delete" ON public.proposal_watches;

CREATE POLICY "proposal_watches_select"
  ON public.proposal_watches FOR SELECT USING (true);
CREATE POLICY "proposal_watches_insert"
  ON public.proposal_watches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proposal_watches_delete"
  ON public.proposal_watches FOR DELETE USING (auth.uid() = user_id);
