-- 1. users 테이블 생성
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  nickname text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Row Level Security (RLS) 설정
alter table public.users enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- 3. (선택사항) Supabase Auth Trigger 설정
-- 카카오 로그인 등 OAuth를 통해 auth.users에 데이터가 생기면 자동으로 public.users에 행을 만들어주는 트리거입니다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, nickname, avatar_url)
  values (
    new.id, 
    -- 카카오 프로필 닉네임을 가져옵니다
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '사용자'), 
    -- 카카오 프로필 아바타를 가져옵니다
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
