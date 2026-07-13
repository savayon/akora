# Akora 프로젝트 대시보드 (Project Status)

이 문서는 프로젝트의 **실제 개발 진행 상태**를 한눈에 파악할 수 있는 대시보드입니다.  
AI 어시스턴트(Antigravity) 및 모든 참여자는 프로젝트 합류 시 가장 먼저 이 문서를 통해 전체 맥락과 현재 작업 위치를 파악합니다.

---

## 📚 문서 역할 가이드 (Document Roles)
Akora 프로젝트는 다음 3개의 문서를 통해 기획과 상태를 분리하여 관리합니다.

* **`product-vision.md`**: 서비스 철학, 존재 이유, 장기 비전, 변하지 않는 원칙 (Debate Log, Reply 구조, 토론 자체가 콘텐츠)
* **`decision-log.md`**: 프로젝트 중 내려진 중요한 의사결정 기록, 채택/폐기된 기획 및 배경
* **`domain-model.md`**: 기획/개발/AI가 공통으로 사용하는 도메인 용어 사전
* **`project-status.md`**: 현재 구현 상태, 진행 중인 작업, 향후 계획 (현재 문서)

---

## 🛠 기술 스택
- **Framework**: Next.js (App Router 기반)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

---

## 🚀 진행 현황 (Status)

### ✅ Completed
- **MVP UI**: 랜딩 페이지, 헤더, 토론 제안 팝업, 자유게시판 등 기본 뼈대
- **Debate Prototype (토론방)**: Summary, Vote, Viewer Layout(2단 분리), Quote(부분 인용), Reply 기능 등 토론방 핵심 UX 구현
- **Landing Page**: 로그인 상태 Dashboard (My Debate), 가로 스크롤 캐러셀 기반 토론 탐색, 커뮤니티 랭킹
- **Header**: 글로벌 네비게이션, 로그인 토글, 알림(Notification) 팝오버
- **Debate Request**: 토론 제안 및 수락/거절 게이트웨이 화면 ("부추기는 중간자 UX")
- **Component Architecture (코드 구조 안정화)**: 공용 컴포넌트 분리 (`DebateInput`, `VotingSection`, `LiveReactionPanel`, `CommentItem`, `CommentSection`, `UserBadge` 등), Custom Hook (`useDebateRoom`) 도입
- **Zustand UX Flow**: Mock 데이터를 전역 상태로 승격하여 페이지 간 상태 및 데이터 흐름 동기화
- **Domain Model**: 5대 핵심 도메인 (`Comment`, `Proposal`, `Debate`, `Turn`, `Notification`) 확립
- **Domain Dictionary**: `docs/domain-model.md` 생성 
- **Type System**: `types/index.ts`로 타입 중앙화 및 Mock 데이터 구조 개편
- **ViewModel 구조**: `BoardComment`, `DraftDebate`, `SelectionPopup` 등 화면별 뷰 전용 데이터와 순수 도메인 객체 분리
- **Mock 기반 UX Flow 연결 완료**: 게시판 ➔ 댓글 ➔ 토론 제안 ➔ 알림 ➔ 수락 ➔ 토론방 진입까지의 유저 여정(Core Journey) 통합

- **Database Schema**: 5대 핵심 도메인의 관계형 데이터베이스 스키마 설계 (`docs/database-schema.md`)
- **Repository Layer**: Supabase 전환을 대비한 의존성 분리형 데이터 액세스 계층(`repositories/`) 뼈대 및 Mock 구현체 세팅

### 🟡 In Progress
*이번 스프린트에서 집중하고 있는 단일 목표입니다.*

- **Auth**: Supabase 통합 및 로그인/인증 시스템 구축 (DB 설계 완료로 곧바로 CRUD 연동 가능)

### 🔮 Future
*앞으로 진행할 굵직한 주요 마일스톤입니다.*

- **Database**: Supabase 프로젝트 연동 및 실제 DB 테이블 생성
- **API Layer**: 프론트엔드 - Supabase 간 통신을 위한 Repository 실제 구현 (현재의 Mock 데이터 대체)
- **WebSocket (Realtime)**: 실시간 양방향 통신 기반 채팅 및 즉각적 알림 연동
- **Notification Persistence**: 알림 데이터 영속화 처리
- **User Profile & 마이페이지**: 유저 프로필 시스템 및 개인 활동 내역 대시보드
- **Search**: 게시물 및 토론 검색 기능
- **Role (권한)**: 사용자 역할(Admin, User 등) 모델링 및 접근 제어
- **Ranking Season**: 정규 시즌제 커뮤니티 랭킹 로직
- **AI Features**: AI 논리 분석, 토론 요약, 중재자 등 인공지능 결합 기능
- **Recommendation**: 사용자 관심사 기반 맞춤형 토론 추천
- **Mobile Optimization**: 모바일 환경 완벽 대응
- **Deployment**: 실 서비스 상용 배포
