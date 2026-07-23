-- AI 토론 주제 및 제목 변경 요청 기능
-- Supabase SQL Editor에서 한 번 실행합니다.

ALTER TABLE public.debates
  ADD COLUMN IF NOT EXISTS topic_status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS topic_generation_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS proposer_topic_edit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS responder_topic_edit_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_topic varchar(20),
  ADD COLUMN IF NOT EXISTS topic_change_requester_id uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS topic_change_requested_at timestamptz;

ALTER TABLE public.debates
  DROP CONSTRAINT IF EXISTS debates_topic_status_check;

ALTER TABLE public.debates
  ADD CONSTRAINT debates_topic_status_check
  CHECK (topic_status IN ('waiting', 'generating', 'completed', 'failed'));

CREATE INDEX IF NOT EXISTS idx_debates_public_topic
  ON public.debates (status, topic_status, created_at DESC);

-- 기존에 기본 제목으로 남아 있던 토론은 참가자가 재생성할 수 있게 표시합니다.
UPDATE public.debates
SET topic_status = 'failed',
    topic_generation_started_at = NULL
WHERE topic = '토론 주제'
  AND topic_status = 'completed';

-- 이전 구현에서 생성 중 상태로 멈춘 토론은 실패로 전환합니다.
UPDATE public.debates
SET topic_status = 'failed',
    topic_generation_started_at = NULL
WHERE topic_status = 'generating'
  AND topic_generation_started_at IS NULL;

-- 보고싶어요 / 추천 / 토론 팔로우에 필요한 테이블입니다.
CREATE TABLE IF NOT EXISTS public.proposal_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (proposal_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.debate_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debate_id uuid NOT NULL REFERENCES public.debates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (debate_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_proposal_watches_proposal ON public.proposal_watches (proposal_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON public.comment_likes (comment_id);
CREATE INDEX IF NOT EXISTS idx_debate_followers_debate ON public.debate_followers (debate_id);

ALTER TABLE public.proposal_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debate_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposal_watches_select" ON public.proposal_watches;
DROP POLICY IF EXISTS "proposal_watches_insert" ON public.proposal_watches;
DROP POLICY IF EXISTS "proposal_watches_delete" ON public.proposal_watches;
CREATE POLICY "proposal_watches_select" ON public.proposal_watches FOR SELECT USING (true);
CREATE POLICY "proposal_watches_insert" ON public.proposal_watches FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "proposal_watches_delete" ON public.proposal_watches FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_likes_select" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_insert" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_delete" ON public.comment_likes;
CREATE POLICY "comment_likes_select" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "comment_likes_insert" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_likes_delete" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "debate_followers_select" ON public.debate_followers;
DROP POLICY IF EXISTS "debate_followers_insert" ON public.debate_followers;
DROP POLICY IF EXISTS "debate_followers_delete" ON public.debate_followers;
CREATE POLICY "debate_followers_select" ON public.debate_followers FOR SELECT USING (true);
CREATE POLICY "debate_followers_insert" ON public.debate_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debate_followers_delete" ON public.debate_followers FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "post_likes_select" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_insert" ON public.post_likes;
DROP POLICY IF EXISTS "post_likes_delete" ON public.post_likes;
CREATE POLICY "post_likes_select" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_comment_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.comments
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  END IF;

  UPDATE public.comments
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.comment_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_like_insert ON public.comment_likes;
DROP TRIGGER IF EXISTS on_comment_like_delete ON public.comment_likes;
CREATE TRIGGER on_comment_like_insert
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_likes_count();
CREATE TRIGGER on_comment_like_delete
  AFTER DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_comment_likes_count();

CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  END IF;

  UPDATE public.posts
  SET likes_count = GREATEST(0, likes_count - 1)
  WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_post_like_insert ON public.post_likes;
DROP TRIGGER IF EXISTS on_post_like_delete ON public.post_likes;
CREATE TRIGGER on_post_like_insert
  AFTER INSERT ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();
CREATE TRIGGER on_post_like_delete
  AFTER DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

CREATE OR REPLACE FUNCTION public.request_debate_topic_change(
  p_debate_id uuid,
  p_new_topic text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_debate public.debates%ROWTYPE;
  v_recipient_id uuid;
BEGIN
  SELECT * INTO v_debate
  FROM public.debates
  WHERE id = p_debate_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION '토론을 찾을 수 없습니다.';
  END IF;

  IF auth.uid() NOT IN (v_debate.proposer_id, v_debate.responder_id) THEN
    RAISE EXCEPTION '토론 참가자만 제목 변경을 요청할 수 있습니다.';
  END IF;

  IF v_debate.status <> 'in_progress' THEN
    RAISE EXCEPTION '진행 중인 토론에서만 제목을 변경할 수 있습니다.';
  END IF;

  IF v_debate.pending_topic IS NOT NULL THEN
    RAISE EXCEPTION '처리 대기 중인 제목 변경 요청이 있습니다.';
  END IF;

  IF char_length(trim(p_new_topic)) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION '제목은 1~20자로 입력해 주세요.';
  END IF;

  IF auth.uid() = v_debate.proposer_id THEN
    IF v_debate.proposer_topic_edit_count >= 2 THEN
      RAISE EXCEPTION '제목 변경 요청 기회를 모두 사용했습니다.';
    END IF;
    UPDATE public.debates
    SET proposer_topic_edit_count = proposer_topic_edit_count + 1,
        pending_topic = trim(p_new_topic),
        topic_change_requester_id = auth.uid(),
        topic_change_requested_at = now()
    WHERE id = p_debate_id;
    v_recipient_id := v_debate.responder_id;
  ELSE
    IF v_debate.responder_topic_edit_count >= 2 THEN
      RAISE EXCEPTION '제목 변경 요청 기회를 모두 사용했습니다.';
    END IF;
    UPDATE public.debates
    SET responder_topic_edit_count = responder_topic_edit_count + 1,
        pending_topic = trim(p_new_topic),
        topic_change_requester_id = auth.uid(),
        topic_change_requested_at = now()
    WHERE id = p_debate_id;
    v_recipient_id := v_debate.proposer_id;
  END IF;

  RETURN json_build_object('recipient_id', v_recipient_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_debate_topic_change(
  p_debate_id uuid,
  p_approve boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_debate public.debates%ROWTYPE;
BEGIN
  SELECT * INTO v_debate
  FROM public.debates
  WHERE id = p_debate_id
  FOR UPDATE;

  IF NOT FOUND OR v_debate.pending_topic IS NULL THEN
    RAISE EXCEPTION '처리할 제목 변경 요청이 없습니다.';
  END IF;

  IF auth.uid() NOT IN (v_debate.proposer_id, v_debate.responder_id)
    OR auth.uid() = v_debate.topic_change_requester_id THEN
    RAISE EXCEPTION '상대 참가자만 제목 변경 요청을 처리할 수 있습니다.';
  END IF;

  UPDATE public.debates
  SET topic = CASE WHEN p_approve THEN pending_topic ELSE topic END,
      topic_status = CASE WHEN p_approve THEN 'completed' ELSE topic_status END,
      pending_topic = NULL,
      topic_change_requester_id = NULL,
      topic_change_requested_at = NULL
  WHERE id = p_debate_id;
END;
$$;
