-- 1. debate_status ENUM에 'judging' 추가
-- (참고: 기존 DB에 'debate_status' ENUM 타입이 존재하지 않는 것으로 확인되었으므로 생략합니다. status 컬럼이 일반 텍스트(varchar)로 구성되어 있어 별도의 스키마 변경 없이 동작합니다.)
-- 2. debates 테이블에 배심원 관련 컬럼 추가
ALTER TABLE public.debates 
ADD COLUMN IF NOT EXISTS required_jurors int DEFAULT 5,
ADD COLUMN IF NOT EXISTS winner_id uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS ended_reason varchar,
ADD COLUMN IF NOT EXISTS timeout_loser_role varchar;

-- 기존 CHECK 제약조건이 있다면 'judging'을 허용하기 위해 삭제 (단순 varchar 처리)
ALTER TABLE public.debates DROP CONSTRAINT IF EXISTS debates_status_check;

-- 3. judgments 테이블 생성
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'juror_type') THEN
        CREATE TYPE juror_type AS ENUM ('human', 'ai', 'expert');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.judgments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    debate_id uuid NOT NULL REFERENCES public.debates(id) ON DELETE CASCADE,
    juror_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    juror_type juror_type DEFAULT 'human' NOT NULL,
    voted_for_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reason text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(debate_id, juror_id) -- 1인 1판정 제한
);

-- RLS (Row Level Security) 설정 (Supabase 권장)
ALTER TABLE public.judgments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "누구나 판정 결과를 볼 수 있음" ON public.judgments;
CREATE POLICY "누구나 판정 결과를 볼 수 있음" ON public.judgments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "인증된 사용자는 판정을 생성할 수 있음" ON public.judgments;
CREATE POLICY "인증된 사용자는 판정을 생성할 수 있음" ON public.judgments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
