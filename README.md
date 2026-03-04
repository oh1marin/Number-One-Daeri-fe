# Number-One-Daeri-fe

대리운전 서비스 모노레포 (프론트엔드).

## 구조

```
ride-platform/
  apps/
    web-home/       Next.js — 대외 홈페이지   (포트 3000)
    web-admin/      Next.js — 운영 관리대장   (포트 3002)
    mobile-user/    [placeholder] Flutter 사용자 앱 — 별도 작업
    mobile-driver/  [placeholder] Flutter 기사 앱   — 별도 작업
  packages/
    shared/         공통 TypeScript 타입
  docs/             설계 문서
```

> **백엔드 API** 는 별도 레포에서 관리.
> **Flutter 앱** 은 별도 폴더에서 독립 작업.

## 시작하기

```bash
# 의존성 설치
pnpm install

# 전체 실행 (홈 + 관리대장)
pnpm dev

# 홈페이지만
pnpm dev:home

# 관리대장만
pnpm dev:admin
```

## 환경변수 설정

```bash
# 백엔드 API 주소 입력
apps/web-home/.env.local   → NEXT_PUBLIC_API_BASE_URL=https://api 주소
apps/web-admin/.env.local  → NEXT_PUBLIC_API_BASE_URL=https://api 주소
```

## 문서

| 파일 | 내용 |
|---|---|
| `docs/ARCHITECTURE.md` | 전체 시스템 구성 및 인프라 |
| `docs/MONOREPO.md` | 폴더 구조 및 워크스페이스 설정 |
| `docs/SPEC.md` | Flutter 앱 스펙 (API, 상태머신, DB 모델) |
| `docs/FLUTTER_GUIDE.md` | Flutter 구현 가이드 |
| `docs/MACOS_BUILD.md` | iOS 빌드 머신 운영 |
