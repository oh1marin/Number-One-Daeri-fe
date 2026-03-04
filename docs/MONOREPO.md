# 모노레포 설계 — ride-platform

> 시스템 개요/역할은 `ARCHITECTURE.md`, 앱 스펙은 `SPEC.md` 참조.
> 이 문서는 **폴더 구조 / 도메인 / 워크스페이스 / Cursor 프롬프트** 를 다룬다.

---

## 폴더 구조

```
ride-platform/
  apps/
    web-home/          # Next.js App Router (대외 홈페이지)
    web-admin/         # Next.js App Router (관리대장)
    mobile-user/       # [placeholder] Flutter 사용자 앱 — 별도 작업
    mobile-driver/     # [placeholder] Flutter 기사 앱   — 별도 작업
  services/
    api/               # Express + TypeScript + Prisma + PostgreSQL
  packages/
    shared/            # 공통 타입/유틸 (TypeScript)
  docs/
    SPEC.md
    FLUTTER_GUIDE.md
    ARCHITECTURE.md
    MONOREPO.md
    MACOS_BUILD.md
  README.md
  package.json         # pnpm workspace 루트
```

> **Flutter 앱은 이 레포에서 설치/실행하지 않는다.**
> `apps/mobile-*` 폴더는 위치 예약용 플레이스홀더. 실제 Flutter 프로젝트는 별도 폴더에서 독립 작업.

---

## 도메인 / 포트 구성

| 앱 | 프로덕션 도메인 | 로컬 포트 |
|---|---|---|
| `web-home` | `www.company.com` | `3000` |
| `web-admin` | `admin.company.com` | `3001` |
| `api` | `api.company.com` | `3002` |

> 각 앱은 `API_BASE_URL` 환경변수로 API 서버 주소를 참조한다. 하드코딩 금지.

---

## pnpm Workspace 설정

### 루트 `package.json`

```jsonc
{
  "name": "ride-platform",
  "private": true,
  "scripts": {
    "dev": "pnpm --parallel -r dev",
    "dev:web": "pnpm --filter web-home --filter web-admin dev",
    "dev:api": "pnpm --filter api dev"
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "services/*"
  - "packages/*"
```

### 각 앱 `.env.local` (예시)

```bash
# apps/web-home/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002

# apps/web-admin/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002

# services/api/.env
DATABASE_URL=postgresql://user:password@localhost:5432/ride_db
PORT=3002
```

---

## packages/shared (공통 타입)

TypeScript 타입을 웹 앱과 API 서버가 공유하는 패키지.

```
packages/shared/
  src/
    types/
      ride.ts      # RideStatus, RideType, PaymentMethod 등
      user.ts      # Role, UserDto
      driver.ts    # DriverStatus, DriverApprovalStatus
    index.ts
  package.json
  tsconfig.json
```

```jsonc
// packages/shared/package.json
{
  "name": "@ride/shared",
  "main": "src/index.ts"
}
```

사용 예시:
```ts
// apps/web-admin 에서
import { RideStatus } from "@ride/shared";

// services/api 에서
import { RideStatus } from "@ride/shared";
```

---

## Cursor AI 프롬프트 (복붙용)

### 1. 모노레포 초기 스캐폴딩

> Flutter 앱은 별도 프로젝트에서 작업하므로 포함하지 않음.

```
다음 구조의 모노레포를 셋업해줘.

루트 디렉토리명: ride-platform
패키지 매니저: pnpm workspaces

앱 구성:
- apps/web-home: Next.js (App Router, TypeScript)
- apps/web-admin: Next.js (App Router, TypeScript)
- services/api: Express + TypeScript + Prisma (PostgreSQL)
- packages/shared: 공통 타입 패키지 (TypeScript)

※ Flutter 앱(mobile-user, mobile-driver)은 별도 프로젝트로 작업하므로 포함 X.
  apps/ 하위에 mobile-user/, mobile-driver/ 빈 폴더(README.md만)만 생성해줘.

포트:
- web-home: 3000
- web-admin: 3001
- api: 3002

요구사항:
- 루트에서 pnpm dev로 전체 동시 실행 (웹 + API만)
- 각 앱이 API_BASE_URL을 환경변수로 참조하도록 설정
- packages/shared의 타입을 web-admin과 api에서 import 가능하게 설정
- 각 앱에 기본 .env.example 파일 생성
```

### 2. API — Ride 도메인 최소 기능

```
services/api에 대리운전 MVP용 Ride 도메인을 추가해줘.

Prisma 모델: User, Ride (최소)
RideStatus enum: PENDING / MATCHED / ACCEPTED / ARRIVED / DRIVING / COMPLETED / CANCELLED / FAILED
PaymentMethod enum: CARD / CASH / MILEAGE

API 엔드포인트:
- POST /rides          : 호출 생성 (pickupLat, pickupLng, pickupAddress, dropoffLat, dropoffLng, dropoffAddress, type, paymentMethod)
- GET  /rides/:id      : 호출 상세 + status
- POST /rides/:id/cancel : 취소

공통 에러 응답 규격:
{ "code": string, "message": string, "detail"?: object }

입력 검증은 zod 사용.
```

### 3. web-admin — 관리대장 기본 화면

```
apps/web-admin에 관리자 대시보드 기본 화면을 만들어줘.

전제: 로그인 완료 상태 (토큰은 localStorage에서 읽어오는 것으로 임시 처리)
API base URL: 환경변수 NEXT_PUBLIC_API_BASE_URL 사용

페이지:
1. /rides
   - 전체 콜 목록 테이블
   - 상태별 필터 (PENDING / MATCHED / ARRIVED / DRIVING / COMPLETED / CANCELLED)
   - 각 행 클릭 시 상세 이동

2. /rides/[id]
   - 콜 상세 정보 표시
   - 상태 변경 버튼 (상태에 따라 가능한 액션만 표시)
   - API: GET /rides/:id, POST /rides/:id/cancel

스타일: Tailwind CSS
```

---

## Admin PC 앱 패키징 계획 (후순위)

`apps/web-admin` (Next.js) → Electron 또는 Tauri로 감싸서 Windows `.exe` 설치형 앱으로 배포 가능.

- **MVP 이후 진행** (웹 버전이 완성된 뒤)
- 웹이 완성되면 패키징은 비교적 간단

| 도구 | 특징 |
|---|---|
| Electron | 생태계 성숙, 번들 크기 큼 |
| Tauri | 경량, Rust 기반, 번들 크기 작음 (권장) |

---

## 핵심 원칙

- `web-home`과 `web-admin`은 같은 레포지만 **서로 독립된 앱**
- **DB 접근은 `services/api`만** — 클라이언트는 API 호출만
- 권한 강제는 API 레벨에서: `/admin/*` → ADMIN role 없으면 `403`
- 환경변수는 각 앱 `.env.local` / `.env` 에서 관리, 코드에 URL 하드코딩 금지
