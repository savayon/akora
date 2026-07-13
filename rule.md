# Akora 프로젝트 개발 원칙 (rule.md)

이 문서는 Akora 프로젝트의 유지보수성과 코드 품질을 높이기 위해 팀원 모두가 준수해야 할 개발 원칙을 정의합니다. 코드를 작성하거나 리팩터링할 때 반드시 이 원칙들을 따르십시오.

## 1. 아키텍처 및 의존성 규칙
- **의존성 방향**: UI (App Router의 Server/Client Component) -> Repository -> Supabase 구조를 엄격하게 유지합니다.
- **UI 계층의 역할**: 
  - 데이터 렌더링, 이벤트 핸들링, 라우팅 등 프론트엔드의 본연의 역할만 수행합니다.
  - UI 컴포넌트 내에서 `supabase.from(...)` 과 같이 DB에 직접 접근하는 코드를 작성해서는 안 됩니다.
- **Repository 계층의 역할**:
  - 데이터베이스 통신(Supabase 쿼리) 및 외부 API 통신을 전담합니다.
  - 쿼리 결과를 프론트엔드가 사용하기 좋은 형태로 매핑(Mapping)하여 반환해야 합니다.

## 2. 공통 컴포넌트 활용 및 분리
- **중복 최소화**: 여러 페이지에서 반복적으로 사용되는 UI(예: `SearchBar`, `BoardListTable`, `Pagination` 등)는 반드시 `components/board` 또는 `components/common` 등의 공통 폴더에 분리하여 재사용합니다.
- **책임 분리 (Single Responsibility Principle)**: 
  - 한 파일이나 컴포넌트가 너무 커지거나 여러 역할을 동시에 수행하면 하위 컴포넌트로 분리합니다. 
  - (예: `page.tsx`가 거대한 경우 `<VoteSection>`, `<DebateCommentSection>` 처럼 의미 있는 단위로 쪼개기)

## 3. Server Component와 의존성 주입 (DI)
- **Supabase Client 주입**:
  - Next.js의 App Router 환경에서는 Server Component와 Client Component에서 사용하는 Supabase Client 생성 방식이 다릅니다.
  - Repository 메서드는 `client?: SupabaseClient` 매개변수를 선택적으로 받아, 호출부에서 적절한 클라이언트를 주입(Dependency Injection)할 수 있도록 설계해야 합니다.
  - 예시: `postRepository.getPosts('free', supabaseServerClient)`

## 4. Utility 및 Mapper 분리
- **데이터 변환 로직 추상화**: 
  - DB에서 가져온 원시 데이터(Raw Data)를 도메인 모델이나 UI 모델로 변환하는 로직은 개별 Repository 내부에 하드코딩하지 않고, `lib/mappers.ts`와 같은 별도 유틸리티 파일에 모아서 관리합니다.
  - 이를 통해 매핑 로직의 재사용성을 높이고 테스트 가능성을 개선합니다.

## 5. 불필요한 코드 관리
- **안 쓰는 코드 제때 정리**: 
  - 사용하지 않는 UI 컴포넌트나 SVG 아이콘 등은 주석으로 방치하지 말고 삭제합니다.
  - 기능 테스트 및 QA를 위해 임시로 작성한 코드는 운영(Production) 배포 전에 반드시 정리해야 합니다.

## 6. 기능 추가 시의 원칙
- 요구사항 정의서나 기획에 명시되지 않은 기능을 임의로 추가하지 마십시오.
- 개선이 필요하다고 판단되는 부분은 독단적으로 결정하지 말고, 논의를 통해 승인을 받은 후 구현에 착수합니다.
- 항상 기존의 코드 구조와 규칙을 존중하고 일관성을 유지하도록 노력하십시오.
