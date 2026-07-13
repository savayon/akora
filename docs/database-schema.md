# Akora 데이터베이스 스키마 (Supabase)

이 문서는 프론트엔드의 도메인 모델(`types/index.ts`)을 기반으로 설계된 **Supabase (PostgreSQL) 관계형 데이터베이스 스키마 초안**입니다.

차후 실제 Auth 시스템과 연동하고 CRUD 기능을 구현하기 위한 "설계도" 역할을 합니다.

---

## 1. 개체 관계도 (ERD 요약)

```
users (1) ─── (N) comments
  │                 │
  │ (1)             │ (1)
  │                 ▽ (N)
  └────────── (N) proposals (1) ─── (1) debates (1) ─── (N) turns (N) ── (1) turns (Self: Quote)
  │
  └────────── (N) notifications
```

---

## 2. 테이블 정의 (Table Definitions)

> **공통 규칙**
> - 모든 PK는 기본적으로 UUID(`uuid`)를 사용합니다 (보안 및 확장성).
> - 시각 정보는 `timestamptz` (Timezone 포함 Timestamp) 타입으로 통일합니다.

### 2.1. `users`
Supabase Auth의 `auth.users`와 연동되는 커스텀 프로필 테이블입니다. 현재 역할(Role) 기능은 보류하고 최소한의 정보만 담습니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
|---|---|---|---|
| `id` | uuid | PK, FK(`auth.users.id`) | Supabase Auth 고유 ID |
| `email` | varchar | UNIQUE, NOT NULL | 로그인/알림용 이메일 |
| `nickname` | varchar | NOT NULL | 서비스에서 노출되는 닉네임 |
| `avatar_url` | varchar | NULL | 프로필 이미지 URL |
| `is_public_profile` | boolean | DEFAULT `true` | 프로필(통계) 공개 여부 |
| `created_at` | timestamptz | DEFAULT `now()` | 가입 일시 |

---

### 2.2. `comments`
자유게시판 등에서 생성되는 일반 댓글입니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 고유 식별자 |
| `author_id` | uuid | FK(`users.id`), NOT NULL | 작성자 |
| `content` | text | NOT NULL | 댓글 내용 |
| `likes_count` | int | DEFAULT 0 | 공감 수 |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |
| `updated_at` | timestamptz | DEFAULT `now()` | 수정 일시 |

---

### 2.3. `proposals`
댓글 등을 기반으로 한 1:1 토론 제안(신청)입니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 고유 식별자 |
| `proposer_id` | uuid | FK(`users.id`), NOT NULL | 제안자 |
| `target_id` | uuid | FK(`users.id`), NOT NULL | 피제안자(상대방) |
| `source_type` | enum | NOT NULL | 출처 타입 (`'comment'`, `'post'` 등) |
| `source_id` | uuid | NOT NULL | 출처 글/댓글의 ID |
| `topic` | varchar | NOT NULL | 제안된 토론 주제 |
| `claim` | text | NOT NULL | 제안자의 핵심 주장 |
| `excerpt` | text | NOT NULL | 상대방 의견에서 인용한 원문 |
| `status` | enum | DEFAULT `'pending'` | 상태 (`pending`, `accepted`, `rejected`, `expired`) |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |

---

### 2.4. `debates`
수락된 제안을 바탕으로 생성되는 정식 토론방입니다.
*(참고: `round` 컬럼은 별도로 저장하지 않으며, `turns` 테이블의 개수를 기반으로 프론트/백엔드에서 동적으로 계산합니다.)*

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 고유 식별자 |
| `proposal_id` | uuid | FK(`proposals.id`), UNIQUE | 기원이 되는 제안 ID |
| `topic` | varchar | NOT NULL | 토론 주제 |
| `proposer_id` | uuid | FK(`users.id`), NOT NULL | 제안자 (창/칼) |
| `responder_id` | uuid | FK(`users.id`), NOT NULL | 응답자 (방패) |
| `origin_type` | varchar | NOT NULL | 최초 발생지 타입 |
| `origin_url` | varchar | NOT NULL | 최초 발생지 URL (바로가기 용도) |
| `status` | enum | DEFAULT `'in_progress'` | 상태 (`in_progress`, `voting`, `completed`) |
| `created_at` | timestamptz | DEFAULT `now()` | 생성 일시 |

---

### 2.5. `turns`
토론방 내부에서의 개별 발언 단위입니다. 부분 인용(Quote) 기능은 동일 테이블에 대한 외래키(Self-referencing FK)로 구현합니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 고유 식별자 |
| `debate_id` | uuid | FK(`debates.id`), NOT NULL | 소속 토론방 |
| `author_id` | uuid | FK(`users.id`), NOT NULL | 발언자 |
| `author_role` | enum | NOT NULL | 발언자 역할 (`'proposer'` / `'responder'`) |
| `turn_num` | int | NOT NULL | 해당 유저의 N번째 발언 (프론트엔드 표기용) |
| `content` | text | NOT NULL | 발언 내용 |
| `quoted_turn_id`| uuid | FK(`turns.id`), NULL | 인용한 상대방 발언의 ID (부분 인용) |
| `quoted_excerpt`| text | NULL | 인용한 텍스트 (원문이 수정되어도 인용본은 유지) |
| `created_at` | timestamptz | DEFAULT `now()` | 발언 일시 |

---

### 2.6. `notifications`
시스템 알림 이벤트입니다.

| 컬럼명 | 데이터 타입 | 제약 조건 | 설명 |
|---|---|---|---|
| `id` | uuid | PK | 고유 식별자 |
| `user_id` | uuid | FK(`users.id`), NOT NULL | 수신자 |
| `type` | enum | NOT NULL | 알림 타입 (`proposal_received`, `turn_arrived`, `debate_ended`) |
| `message` | text | NOT NULL | 알림 주요 메시지 |
| `subtext` | text | NULL | 보조 설명 내용 |
| `link` | varchar | NOT NULL | 클릭 시 이동할 URL |
| `is_read` | boolean | DEFAULT `false` | 읽음 여부 |
| `created_at` | timestamptz | DEFAULT `now()` | 알림 생성 일시 |

---

## 3. RLS (Row Level Security) 관점 검토

Supabase 적용 시 가장 중요한 보안 요소인 **RLS 정책(Policy)** 검토 사항입니다.

*   **읽기 (SELECT)**:
    *   `users`, `comments`, `debates`, `turns` 데이터는 서비스 성격상 기본적으로 **모든 사용자(익명 포함)에게 공개(Public Read)** 됩니다.
    *   단, `notifications`, `proposals`의 상세 내용은 수신자(`target_id` 또는 `user_id`)와 송신자 본인만 읽을 수 있도록 제한해야 합니다.
*   **쓰기 (INSERT/UPDATE/DELETE)**:
    *   모든 테이블의 쓰기 권한은 **인증된 사용자(Authenticated) 본인(자신의 `author_id` 또는 `proposer_id`)에게만 허용**해야 합니다.
    *   다른 유저의 데이터 수정은 엄격히 차단(DENY)하며, 상태 전이(`status` 변경 등)는 제한된 트리거(Trigger) 또는 Edge Function을 통해 서버 사이드에서 안전하게 수행하도록 통제하는 것을 권장합니다.
