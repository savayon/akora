-- 1. random_topics 테이블 생성
CREATE TABLE IF NOT EXISTS public.random_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text,
  weight int DEFAULT 10,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.random_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view enabled topics" ON public.random_topics FOR SELECT USING (enabled = true);

-- 더미 데이터 삽입
INSERT INTO public.random_topics (title, category, weight) VALUES
('AI 발전은 인류에게 축복인가, 재앙인가?', '기술', 10),
('기본소득제 도입, 찬성 vs 반대', '경제', 10),
('촉법소년 연령 하향, 필요한가?', '사회', 10),
('사형제도 유지 vs 폐지', '사회', 10),
('모병제 전환, 시기상조인가?', '정치', 5);

-- 2. matching_queue 테이블 생성
CREATE TABLE IF NOT EXISTS public.matching_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL CHECK (status IN ('waiting', 'matching', 'matched', 'canceled', 'timeout', 'failed')),
  matched_debate_id uuid REFERENCES public.debates(id),
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- RLS 설정
ALTER TABLE public.matching_queue ENABLE ROW LEVEL SECURITY;
-- 유저는 본인 큐 조회/수정 가능
CREATE POLICY "Users can view their own queue" ON public.matching_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own queue" ON public.matching_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own queue" ON public.matching_queue FOR UPDATE USING (auth.uid() = user_id);

CREATE INDEX idx_matching_queue_status_time ON public.matching_queue(status, created_at);

-- 3. 매칭을 위한 RPC (원자적 트랜잭션)
CREATE OR REPLACE FUNCTION public.match_users(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_opponent_id uuid;
  v_my_queue_id uuid;
  v_opponent_queue_id uuid;
BEGIN
  -- 1. 내 대기열 레코드 ID 확인 (waiting 상태여야 함)
  SELECT id INTO v_my_queue_id
  FROM public.matching_queue
  WHERE user_id = p_user_id AND status = 'waiting'
  ORDER BY created_at DESC LIMIT 1;

  IF v_my_queue_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. 나와 다른 'waiting' 유저를 하나 찾아서 LOCK을 건다 (FOR UPDATE SKIP LOCKED)
  -- 30초 이상 하트비트가 끊기지 않은 유저만 매칭
  SELECT id, user_id INTO v_opponent_queue_id, v_opponent_id
  FROM public.matching_queue
  WHERE status = 'waiting' 
    AND user_id != p_user_id
    AND last_seen_at >= now() - interval '30 seconds'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- 3. 상대를 찾았으면 둘 다 'matching' 상태로 변경
  IF v_opponent_queue_id IS NOT NULL THEN
    UPDATE public.matching_queue
    SET status = 'matching'
    WHERE id IN (v_my_queue_id, v_opponent_queue_id);
    
    RETURN v_opponent_id;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;
