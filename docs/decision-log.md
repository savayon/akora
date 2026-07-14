# Decision Log

## 결정 1. Cloudflare를 기본 배포 플랫폼으로 채택

**결정 이유**
- MVP 운영비 최소화
- 상업 서비스 운영 가능
- 장기 운영 적합
- 플랫폼 종속 최소화

**Trade-off**
- Cloudflare는 Edge Runtime 환경을 사용한다.
- 따라서 런타임 제약, 외부 라이브러리 호환성, API Route 구현 방식을 항상 고려해야 한다.

**향후 원칙**
- 배포 플랫폼에 종속되는 기능은 가능한 사용하지 않는다.
- Cloudflare 전용 기능을 사용할 경우에는 '대체 가능 여부'를 먼저 검토한다.
- 향후 다른 플랫폼(Render, Fly.io, 자체 서버 등)으로 이전 가능한 구조를 유지한다.
- **배포 플랫폼은 인프라 선택일 뿐이며, 애플리케이션의 비즈니스 로직은 특정 플랫폼에 의존하지 않는다.**

## 결정 2. Next.js 16 + OpenNext 배포 시 Webpack 빌드 강제 사용

**결정 이유**
- Next.js 16 버전에서 기본으로 사용하는 Turbopack이 서버 런타임 코드를 동적 로딩(dynamic require)하는 방식으로 번들링함.
- OpenNext (v1.20.1 기준) 번들러는 Cloudflare Worker 배포 시 이러한 동적 로딩 구조를 단일 런타임 워커 파일(`worker.js`)로 완벽하게 병합하지 못하는 호환성 문제가 있음.
- 이로 인해 Turbopack 빌드본을 배포하면 미들웨어 핸들러 바인딩 오류(`TypeError: components.ComponentMod.handler is not a function`) 및 런타임 청크 로딩 오류(`ChunkLoadError`)로 인해 사이트 접속 시 500 에러가 발생함.
- 안정적인 Webpack 번들러(`next build --webpack`)를 강제로 사용함으로써 OpenNext와의 빌드 호환성과 런타임 안정성을 확보함.

**적용 사항**
- `package.json`의 빌드 스크립트 변경: `"build": "next build --webpack"`
