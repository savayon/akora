-- ============================================================
-- Agora 프로젝트 Supabase Migration SQL
-- ============================================================
-- 이 SQL은 Supabase SQL Editor에서 실행합니다.
-- 기존 테이블이 있어도 안전하게 동작합니다 (IF NOT EXISTS).
-- ============================================================


-- 1. users 테이블 (기존 존재 시 안전 처리)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  nickname text,
  avatar_url text,
  role text DEFAULT 'user' NOT NULL,
  is_onboarded boolean DEFAULT false NOT NULL,
  is_public_profile boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- role 컬럼이 없으면 추가 (기존 테이블이 있는 경우)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role text DEFAULT 'user' NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_onboarded'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_onboarded boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'is_public_profile'
  ) THEN
    ALTER TABLE public.users ADD COLUMN is_public_profile boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- 트리거 함수 (기존 있으면 교체)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, nickname, avatar_url, role, is_onboarded, is_public_profile)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '사용자'),
    NULL,
    'user',
    false,
    true
  );
  RETURN NEW;
END;
$$;

-- 트리거 (이미 있으면 재생성)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 기존 가입자(auth.users) 강제 동기화
-- (이전에 카카오 로그인 등을 통해 auth.users에만 존재하고 public.users에 누락된 계정을 복구합니다)
INSERT INTO public.users (id, nickname, avatar_url, role, is_onboarded)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', '사용자'), 
  NULL, 
  'user',
  false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);

-- 1-1. Helper: admin 체크 함수 (users 테이블 생성 후 정의)
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. posts 테이블 (게시글 — 자유/토의 통합)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  board_type text NOT NULL CHECK (board_type IN ('free', 'discuss')),
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  views_count int DEFAULT 0 NOT NULL,
  likes_count int DEFAULT 0 NOT NULL,
  comments_count int DEFAULT 0 NOT NULL,
  is_hidden boolean DEFAULT false NOT NULL,
  has_active_debates boolean DEFAULT false NOT NULL,
  deleted_at timestamptz,
  deleted_reason text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_posts_board_type ON public.posts(board_type);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- 3. comments 테이블 (댓글 + 대댓글)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  likes_count int DEFAULT 0 NOT NULL,
  reply_type text DEFAULT 'normal' NOT NULL CHECK (reply_type IN ('normal', 'proposal', 'system', 'moderator')),
  target_user_id uuid REFERENCES public.users(id),
  is_hidden boolean DEFAULT false NOT NULL,
  deleted_at timestamptz,
  deleted_reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);

-- 4. discussion_topics 테이블 (논제)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_topics (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid,
  CONSTRAINT discussion_topics_author_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  stance_a text NOT NULL,
  stance_b text NOT NULL,
  votes_a int DEFAULT 0 NOT NULL,
  votes_b int DEFAULT 0 NOT NULL,
  deleted_at timestamptz,
  deleted_reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discussion_topics_author ON public.discussion_topics(author_id);

-- 5. discussion_votes 테이블 (논제 투표 추적)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES public.discussion_topics(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stance text NOT NULL CHECK (stance IN ('A', 'B')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(topic_id, user_id)
);

-- 6. discussion_comments 테이블 (논제 의견)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discussion_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id uuid REFERENCES public.discussion_topics(id) ON DELETE CASCADE NOT NULL,
  author_id uuid,
  CONSTRAINT discussion_comments_author_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL,
  content text NOT NULL,
  stance text NOT NULL CHECK (stance IN ('A', 'B')),
  likes_count int DEFAULT 0 NOT NULL,
  deleted_at timestamptz,
  deleted_reason text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_topic ON public.discussion_comments(topic_id);

-- 7. proposals 테이블 (토론 제안)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposer_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  target_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('comment', 'post')),
  source_id uuid NOT NULL,
  topic text NOT NULL,
  claim text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON public.proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_proposals_target ON public.proposals(target_id);

-- 8. debates 테이블 (토론 세션)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.debates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid REFERENCES public.proposals(id) UNIQUE,
  topic text NOT NULL,
  proposer_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  responder_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  origin_type text NOT NULL DEFAULT '',
  origin_preview text NOT NULL DEFAULT '',
  origin_url text NOT NULL DEFAULT '',
  status text DEFAULT 'in_progress' NOT NULL CHECK (status IN ('in_progress', 'voting', 'completed')),
  ended_reason text CHECK (ended_reason IN ('timeout', 'normal', 'abandoned')),
  timeout_loser_role text CHECK (timeout_loser_role IN ('proposer', 'responder')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_debates_proposer ON public.debates(proposer_id);
CREATE INDEX IF NOT EXISTS idx_debates_responder ON public.debates(responder_id);
CREATE INDEX IF NOT EXISTS idx_debates_status ON public.debates(status);

-- 9. turns 테이블 (토론 발언)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.turns (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id uuid REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('proposer', 'responder')),
  turn_num int NOT NULL,
  content text NOT NULL,
  quoted_turn_id uuid REFERENCES public.turns(id),
  quoted_excerpt text,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_turns_debate ON public.turns(debate_id);
CREATE INDEX IF NOT EXISTS idx_turns_created ON public.turns(debate_id, created_at);

-- 10. notifications 테이블 (알림)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('proposal_received', 'turn_arrived', 'debate_ended')),
  icon text NOT NULL DEFAULT '🔔',
  message text NOT NULL,
  subtext text,
  link text NOT NULL DEFAULT '/',
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- 11. debate_comments 테이블 (관전자 반응)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.debate_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id uuid REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  likes_count int DEFAULT 0 NOT NULL,
  is_hidden boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_debate_comments_debate ON public.debate_comments(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_comments_created ON public.debate_comments(debate_id, created_at);

ALTER TABLE public.debate_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "debate_comments_select" ON public.debate_comments;
DROP POLICY IF EXISTS "debate_comments_insert" ON public.debate_comments;
DROP POLICY IF EXISTS "debate_comments_update" ON public.debate_comments;
DROP POLICY IF EXISTS "debate_comments_delete" ON public.debate_comments;
CREATE POLICY "debate_comments_select" ON public.debate_comments FOR SELECT USING (is_hidden = false OR public.is_admin());
CREATE POLICY "debate_comments_insert" ON public.debate_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "debate_comments_update" ON public.debate_comments FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "debate_comments_delete" ON public.debate_comments FOR DELETE USING (auth.uid() = author_id);

-- 12. debate_votes 테이블 (토론 투표)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.debate_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  debate_id uuid REFERENCES public.debates(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stance text NOT NULL CHECK (stance IN ('proposer', 'responder')),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(debate_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_debate_votes_debate ON public.debate_votes(debate_id);
CREATE INDEX IF NOT EXISTS idx_debate_votes_user ON public.debate_votes(user_id);

ALTER TABLE public.debate_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "debate_votes_select" ON public.debate_votes;
DROP POLICY IF EXISTS "debate_votes_insert" ON public.debate_votes;
CREATE POLICY "debate_votes_select" ON public.debate_votes FOR SELECT USING (true);
CREATE POLICY "debate_votes_insert" ON public.debate_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 13. debate_comment_likes 테이블 (관전자 반응 추천)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.debate_comment_likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id uuid REFERENCES public.debate_comments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_debate_comment_likes_comment ON public.debate_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_debate_comment_likes_user ON public.debate_comment_likes(user_id);

ALTER TABLE public.debate_comment_likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "debate_comment_likes_select" ON public.debate_comment_likes;
DROP POLICY IF EXISTS "debate_comment_likes_insert" ON public.debate_comment_likes;
DROP POLICY IF EXISTS "debate_comment_likes_delete" ON public.debate_comment_likes;
CREATE POLICY "debate_comment_likes_select" ON public.debate_comment_likes FOR SELECT USING (true);
CREATE POLICY "debate_comment_likes_insert" ON public.debate_comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debate_comment_likes_delete" ON public.debate_comment_likes FOR DELETE USING (auth.uid() = user_id);

-- 14. reports 테이블 (신고)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type text NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id uuid NOT NULL,
  reporter_id uuid NOT NULL,
  CONSTRAINT reports_reporter_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  detail text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

-- users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_update" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (is_hidden = false OR public.is_admin());
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (auth.uid() = author_id);

-- comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_select" ON public.comments;
DROP POLICY IF EXISTS "comments_insert" ON public.comments;
DROP POLICY IF EXISTS "comments_update" ON public.comments;
DROP POLICY IF EXISTS "comments_delete" ON public.comments;
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (is_hidden = false OR public.is_admin());
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (auth.uid() = author_id);

-- discussion_topics
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discussion_topics_select" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_insert" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_update" ON public.discussion_topics;
DROP POLICY IF EXISTS "discussion_topics_delete" ON public.discussion_topics;
CREATE POLICY "discussion_topics_select" ON public.discussion_topics FOR SELECT USING (true);
CREATE POLICY "discussion_topics_insert" ON public.discussion_topics FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "discussion_topics_update" ON public.discussion_topics FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "discussion_topics_delete" ON public.discussion_topics FOR DELETE USING (auth.uid() = author_id);

-- discussion_votes
ALTER TABLE public.discussion_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discussion_votes_select" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_insert" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_update" ON public.discussion_votes;
DROP POLICY IF EXISTS "discussion_votes_delete" ON public.discussion_votes;
CREATE POLICY "discussion_votes_select" ON public.discussion_votes FOR SELECT USING (true);
CREATE POLICY "discussion_votes_insert" ON public.discussion_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "discussion_votes_update" ON public.discussion_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "discussion_votes_delete" ON public.discussion_votes FOR DELETE USING (auth.uid() = user_id);

-- discussion_comments
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discussion_comments_select" ON public.discussion_comments;
DROP POLICY IF EXISTS "discussion_comments_insert" ON public.discussion_comments;
DROP POLICY IF EXISTS "discussion_comments_update" ON public.discussion_comments;
DROP POLICY IF EXISTS "discussion_comments_delete" ON public.discussion_comments;
CREATE POLICY "discussion_comments_select" ON public.discussion_comments FOR SELECT USING (true);
CREATE POLICY "discussion_comments_insert" ON public.discussion_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "discussion_comments_delete" ON public.discussion_comments FOR DELETE USING (auth.uid() = author_id);

-- proposals
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "proposals_select" ON public.proposals;
DROP POLICY IF EXISTS "proposals_insert" ON public.proposals;
DROP POLICY IF EXISTS "proposals_update" ON public.proposals;
CREATE POLICY "proposals_select" ON public.proposals FOR SELECT USING (auth.uid() = proposer_id OR auth.uid() = target_id OR public.is_admin());
CREATE POLICY "proposals_insert" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = proposer_id);
CREATE POLICY "proposals_update" ON public.proposals FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = target_id);

-- debates
ALTER TABLE public.debates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "debates_select" ON public.debates;
DROP POLICY IF EXISTS "debates_insert" ON public.debates;
DROP POLICY IF EXISTS "debates_update" ON public.debates;
CREATE POLICY "debates_select" ON public.debates FOR SELECT USING (true);
CREATE POLICY "debates_insert" ON public.debates FOR INSERT WITH CHECK (auth.uid() = proposer_id OR auth.uid() = responder_id);
CREATE POLICY "debates_update" ON public.debates FOR UPDATE USING (auth.uid() = proposer_id OR auth.uid() = responder_id);

-- turns
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "turns_select" ON public.turns;
DROP POLICY IF EXISTS "turns_insert" ON public.turns;
CREATE POLICY "turns_select" ON public.turns FOR SELECT USING (true);
CREATE POLICY "turns_insert" ON public.turns FOR INSERT WITH CHECK (auth.uid() = author_id);

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_update" ON public.reports;
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (public.is_admin());
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (public.is_admin());

-- ============================================================
-- RPC Functions (조회수, 댓글수 증가)
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_views(post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.posts
  SET views_count = views_count + 1
  WHERE id = post_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_comment_count(p_post_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.posts
  SET comments_count = comments_count + 1
  WHERE id = p_post_id;
$$;

-- ============================================================
-- 투표 자동 차감 트리거 및 회원탈퇴 RPC
-- ============================================================

CREATE OR REPLACE FUNCTION public.decrement_topic_vote_on_delete()
RETURNS trigger AS $$
BEGIN
  IF OLD.stance = 'A' THEN
    UPDATE public.discussion_topics SET votes_a = GREATEST(0, votes_a - 1) WHERE id = OLD.topic_id;
  ELSIF OLD.stance = 'B' THEN
    UPDATE public.discussion_topics SET votes_b = GREATEST(0, votes_b - 1) WHERE id = OLD.topic_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_discussion_vote_delete ON public.discussion_votes;
CREATE TRIGGER on_discussion_vote_delete
  AFTER DELETE ON public.discussion_votes
  FOR EACH ROW EXECUTE PROCEDURE public.decrement_topic_vote_on_delete();

-- ============================================================
-- 관전자 반응 추천 자동 증감 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_debate_comment_like()
RETURNS trigger AS $$
BEGIN
  UPDATE public.debate_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_debate_comment_like_insert ON public.debate_comment_likes;
CREATE TRIGGER on_debate_comment_like_insert
  AFTER INSERT ON public.debate_comment_likes
  FOR EACH ROW EXECUTE PROCEDURE public.increment_debate_comment_like();

CREATE OR REPLACE FUNCTION public.decrement_debate_comment_like()
RETURNS trigger AS $$
BEGIN
  UPDATE public.debate_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.comment_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_debate_comment_like_delete ON public.debate_comment_likes;
CREATE TRIGGER on_debate_comment_like_delete
  AFTER DELETE ON public.debate_comment_likes
  FOR EACH ROW EXECUTE PROCEDURE public.decrement_debate_comment_like();

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 자신이 로그인한 유저인 경우에만
  IF auth.uid() IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = auth.uid();
  END IF;
END;
$$;

-- 기존 테이블들을 위한 ALTER TABLE (Migration 멱등성)
DO $$
BEGIN
  -- users 테이블 is_onboarded (위에서 처리 완료)

  -- Users update own profile public setting policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own public profile setting') THEN
    CREATE POLICY "Users can update their own public profile setting" 
    ON public.users FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);
  END IF;

  -- posts 테이블
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.posts ADD COLUMN deleted_at timestamptz;
    ALTER TABLE public.posts ADD COLUMN deleted_reason text;
    ALTER TABLE public.posts ALTER COLUMN author_id DROP NOT NULL;
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_author_id_fkey;
    ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- comments 테이블
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'comments' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.comments ADD COLUMN deleted_at timestamptz;
    ALTER TABLE public.comments ADD COLUMN deleted_reason text;
    ALTER TABLE public.comments ALTER COLUMN author_id DROP NOT NULL;
    ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_author_id_fkey;
    ALTER TABLE public.comments ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- discussion_topics 테이블
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_topics' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.discussion_topics ADD COLUMN deleted_at timestamptz;
    ALTER TABLE public.discussion_topics ADD COLUMN deleted_reason text;
    ALTER TABLE public.discussion_topics ALTER COLUMN author_id DROP NOT NULL;
    ALTER TABLE public.discussion_topics DROP CONSTRAINT IF EXISTS discussion_topics_author_fkey;
    ALTER TABLE public.discussion_topics ADD CONSTRAINT discussion_topics_author_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- discussion_comments 테이블
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussion_comments' AND column_name = 'deleted_at') THEN
    ALTER TABLE public.discussion_comments ADD COLUMN deleted_at timestamptz;
    ALTER TABLE public.discussion_comments ADD COLUMN deleted_reason text;
    ALTER TABLE public.discussion_comments ALTER COLUMN author_id DROP NOT NULL;
    ALTER TABLE public.discussion_comments DROP CONSTRAINT IF EXISTS discussion_comments_author_fkey;
    ALTER TABLE public.discussion_comments ADD CONSTRAINT discussion_comments_author_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 완료 메시지
-- ============================================================
DO $$ BEGIN RAISE NOTICE 'Agora Migration 완료: 모든 테이블 및 RLS 정책이 설정되었습니다.'; END $$;

-- ============================================================
-- 시간초과 강제 패배 관련 추가 스키마 및 RPC
-- ============================================================

-- 발언 등록 시 시간 초과 검증 및 자동 종료 처리를 원자적으로 수행하는 RPC
CREATE OR REPLACE FUNCTION public.add_turn_safely(
  p_debate_id uuid,
  p_author_id uuid,
  p_author_role text,
  p_turn_num int,
  p_content text,
  p_quoted_turn_id uuid DEFAULT NULL,
  p_quoted_excerpt text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_last_turn_time timestamptz;
  v_debate_created_at timestamptz;
  v_time_limit interval := interval '12 hours';
  v_new_turn_id uuid;
  v_turn_row record;
BEGIN
  -- 1. 토론 상태 조회 (행 잠금을 통해 동시성 제어)
  SELECT status, created_at
  INTO v_status, v_debate_created_at
  FROM public.debates
  WHERE id = p_debate_id
  FOR UPDATE;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Debate not found';
  END IF;

  IF v_status != 'in_progress' THEN
    RAISE EXCEPTION 'Debate is already ended (status: %)', v_status;
  END IF;

  -- 2. 마지막 발언 시간 조회
  SELECT created_at
  INTO v_last_turn_time
  FROM public.turns
  WHERE debate_id = p_debate_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- 마지막 발언이 없으면 토론 생성 시간 기준
  IF v_last_turn_time IS NULL THEN
    v_last_turn_time := v_debate_created_at;
  END IF;

  -- 3. 기한 만료 검증
  IF now() > v_last_turn_time + v_time_limit THEN
    -- 기한 초과: 강제 종료 처리 (timeout loss)
    UPDATE public.debates
    SET status = 'voting',
        ended_reason = 'timeout',
        timeout_loser_role = p_author_role
    WHERE id = p_debate_id AND status = 'in_progress';
    
    RAISE EXCEPTION 'Time limit exceeded. Debate has been automatically ended with a timeout loss.';
  END IF;

  -- 4. 발언 등록
  INSERT INTO public.turns (
    debate_id, author_id, author_role, turn_num, content, quoted_turn_id, quoted_excerpt
  ) VALUES (
    p_debate_id, p_author_id, p_author_role, p_turn_num, p_content, p_quoted_turn_id, p_quoted_excerpt
  ) RETURNING * INTO v_turn_row;

  RETURN row_to_json(v_turn_row);
END;
$$;- -   1 .   c o m m e n t _ l i k e s   ? �� �ɑ? ? y�f� 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . c o m m e n t _ l i k e s   (  
     i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   u u i d _ g e n e r a t e _ v 4 ( ) ,  
     c o m m e n t _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   p u b l i c . c o m m e n t s ( i d )   O N   D E L E T E   C A S C A D E ,  
     u s e r _ i d   U U I D   N O T   N U L L   R E F E R E N C E S   a u t h . u s e r s ( i d )   O N   D E L E T E   C A S C A D E ,  
     c r e a t e d _ a t   T I M E S T A M P   W I T H   T I M E   Z O N E   D E F A U L T   t i m e z o n e ( ' u t c ' : : t e x t ,   n o w ( ) )   N O T   N U L L ,  
     U N I Q U E ( c o m m e n t _ i d ,   u s e r _ i d )  
 ) ;  
  
 - -   2 .   ? ��3�? ? ? y�f� 
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m e n t _ l i k e s _ c o m m e n t   O N   p u b l i c . c o m m e n t _ l i k e s ( c o m m e n t _ i d ) ;  
 C R E A T E   I N D E X   I F   N O T   E X I S T S   i d x _ c o m m e n t _ l i k e s _ u s e r   O N   p u b l i c . c o m m e n t _ l i k e s ( u s e r _ i d ) ;  
  
 - -   3 .   R L S   ? ��I�  ? |1� 
 A L T E R   T A B L E   p u b l i c . c o m m e n t _ l i k e s   E N A B L E   R O W   L E V E L   S E C U R I T Y ;  
  
 D R O P   P O L I C Y   I F   E X I S T S   " c o m m e n t _ l i k e s _ s e l e c t "   O N   p u b l i c . c o m m e n t _ l i k e s ;  
 D R O P   P O L I C Y   I F   E X I S T S   " c o m m e n t _ l i k e s _ i n s e r t "   O N   p u b l i c . c o m m e n t _ l i k e s ;  
 D R O P   P O L I C Y   I F   E X I S T S   " c o m m e n t _ l i k e s _ d e l e t e "   O N   p u b l i c . c o m m e n t _ l i k e s ;  
  
 C R E A T E   P O L I C Y   " c o m m e n t _ l i k e s _ s e l e c t "   O N   p u b l i c . c o m m e n t _ l i k e s   F O R   S E L E C T   U S I N G   ( t r u e ) ;  
 C R E A T E   P O L I C Y   " c o m m e n t _ l i k e s _ i n s e r t "   O N   p u b l i c . c o m m e n t _ l i k e s   F O R   I N S E R T   W I T H   C H E C K   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
 C R E A T E   P O L I C Y   " c o m m e n t _ l i k e s _ d e l e t e "   O N   p u b l i c . c o m m e n t _ l i k e s   F O R   D E L E T E   U S I N G   ( a u t h . u i d ( )   =   u s e r _ i d ) ;  
  
 - -   4 .   ? ��%�Z? ? e$Բ  ? y�f�  ( c o m m e n t s   ? �� �ɑ����  l i k e s _ c o u n t   ? ��2�? �ô)  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   u p d a t e _ c o m m e n t _ l i k e s _ c o u n t ( )  
 R E T U R N S   T R I G G E R   A S   $ $  
 B E G I N  
     I F   T G _ O P   =   ' I N S E R T '   T H E N  
         U P D A T E   p u b l i c . c o m m e n t s  
         S E T   l i k e s _ c o u n t   =   l i k e s _ c o u n t   +   1  
         W H E R E   i d   =   N E W . c o m m e n t _ i d ;  
         R E T U R N   N E W ;  
     E L S I F   T G _ O P   =   ' D E L E T E '   T H E N  
         U P D A T E   p u b l i c . c o m m e n t s  
         S E T   l i k e s _ c o u n t   =   l i k e s _ c o u n t   -   1  
         W H E R E   i d   =   O L D . c o m m e n t _ i d ;  
         R E T U R N   O L D ;  
     E N D   I F ;  
     R E T U R N   N U L L ;  
 E N D ;  
 $ $   L A N G U A G E   p l p g s q l   S E C U R I T Y   D E F I N E R ;  
  
 - -   5 .   ? ��%�Z? ? E�	� 
 D R O P   T R I G G E R   I F   E X I S T S   o n _ c o m m e n t _ l i k e _ i n s e r t   O N   p u b l i c . c o m m e n t _ l i k e s ;  
 C R E A T E   T R I G G E R   o n _ c o m m e n t _ l i k e _ i n s e r t  
     A F T E R   I N S E R T   O N   p u b l i c . c o m m e n t _ l i k e s  
     F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   u p d a t e _ c o m m e n t _ l i k e s _ c o u n t ( ) ;  
  
 D R O P   T R I G G E R   I F   E X I S T S   o n _ c o m m e n t _ l i k e _ d e l e t e   O N   p u b l i c . c o m m e n t _ l i k e s ;  
 C R E A T E   T R I G G E R   o n _ c o m m e n t _ l i k e _ d e l e t e  
     A F T E R   D E L E T E   O N   p u b l i c . c o m m e n t _ l i k e s  
     F O R   E A C H   R O W   E X E C U T E   F U N C T I O N   u p d a t e _ c o m m e n t _ l i k e s _ c o u n t ( ) ;  
 