-- 1. debates 테이블에 judging_ends_at 컬럼 추가
ALTER TABLE public.debates
ADD COLUMN IF NOT EXISTS judging_ends_at timestamptz;

-- 2. 기존 judging 상태인 토론들에 대한 초기값 설정 (선택 사항)
-- 이미 judging인 토론은 업데이트 시점을 알기 어려우므로 일괄적으로 현재 시간 기준 72시간으로 설정
UPDATE public.debates
SET judging_ends_at = NOW() + INTERVAL '72 hours'
WHERE status = 'judging' AND judging_ends_at IS NULL;

-- 3. timeout_debate RPC 함수 수정 (judging_ends_at 자동 세팅)
CREATE OR REPLACE FUNCTION public.timeout_debate(p_debate_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_status text;
    v_last_turn_time timestamptz;
    v_last_turn_author text;
    v_loser_role text;
BEGIN
    -- 1. 토론 상태 확인
    SELECT status INTO v_status
    FROM public.debates
    WHERE id = p_debate_id;

    -- 진행중이 아니면 업데이트 안함 (치팅 방지)
    IF v_status != 'in_progress' THEN
        RETURN FALSE;
    END IF;

    -- 2. 마지막 턴 시간 및 작성자 확인
    SELECT created_at, author_role INTO v_last_turn_time, v_last_turn_author
    FROM public.turns
    WHERE debate_id = p_debate_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- 3. 턴이 없는 경우 (토론 시작 시간 기준)
    IF v_last_turn_time IS NULL THEN
        SELECT created_at INTO v_last_turn_time
        FROM public.debates
        WHERE id = p_debate_id;
        v_loser_role := 'proposer';
    ELSE
        -- 턴이 있는 경우, 턴 작성자의 반대 역할이 패배자
        IF v_last_turn_author = 'proposer' THEN
            v_loser_role := 'responder';
        ELSE
            v_loser_role := 'proposer';
        END IF;
    END IF;

    -- 4. 진짜 12시간 지났는지 확인
    IF EXTRACT(EPOCH FROM (now() - v_last_turn_time)) >= 12 * 3600 THEN
        UPDATE public.debates
        SET status = 'judging',
            ended_reason = 'timeout',
            timeout_loser_role = v_loser_role,
            judging_ends_at = NOW() + INTERVAL '72 hours'
        WHERE id = p_debate_id;
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$;
