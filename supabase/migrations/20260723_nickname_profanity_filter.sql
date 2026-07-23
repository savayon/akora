-- 1. 금칙어 테이블 생성
CREATE TABLE IF NOT EXISTS public.banned_words (
  word text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- 누구나 읽을 수는 없게 하고 관리자만 볼 수 있게 RLS 처리 (혹은 읽기만 가능하게)
ALTER TABLE public.banned_words ENABLE ROW LEVEL SECURITY;
-- 일반적으로 유저가 금칙어 목록을 조회할 필요는 없으므로 접근 제한(API로는 노출 안 됨)

-- 기본 금칙어 예시 삽입 (나중에 txt 내용으로 대시보드에서 추가 가능)
INSERT INTO public.banned_words (word) VALUES 
('씨발'), ('개새끼'), ('병신'), ('지랄'), ('좆'), ('존나'), ('애미')
ON CONFLICT DO NOTHING;

-- 2. 닉네임 유효성 검사 및 금칙어 필터링 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.check_nickname_validity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 닉네임이 변경되거나 새로 생성될 때만 검사
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.nickname IS DISTINCT FROM OLD.nickname) THEN
    
    -- 1) 정규식을 이용한 특수문자 및 띄어쓰기 검사 (한글, 영문 대소문자, 숫자만 허용)
    IF NEW.nickname !~ '^[a-zA-Z0-9가-힣]+$' THEN
      RAISE EXCEPTION '닉네임에는 띄어쓰기나 특수문자를 사용할 수 없습니다.';
    END IF;

    -- 2) 금칙어 포함 여부 검사
    -- banned_words 테이블의 단어가 닉네임에 일부라도 포함되어 있는지 확인
    IF EXISTS (
      SELECT 1 
      FROM public.banned_words 
      WHERE NEW.nickname ILIKE '%' || word || '%'
    ) THEN
      RAISE EXCEPTION '닉네임에 사용할 수 없는 단어(금칙어)가 포함되어 있습니다.';
    END IF;
    
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Users 테이블에 트리거 부착
-- 기존에 유사한 트리거가 있다면 안전하게 DROP 후 다시 생성
DROP TRIGGER IF EXISTS trg_check_nickname ON public.users;
CREATE TRIGGER trg_check_nickname
  BEFORE INSERT OR UPDATE OF nickname
  ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nickname_validity();
