# 대리운전 서비스 — 전체 아키텍처 & 시스템 구성

> Flutter 앱 상세 스펙은 `SPEC.md`, 빌드 운영은 `MACOS_BUILD.md` 참조.
> 이 문서는 **전체 시스템 구성 / 인프라 / Admin / 개발 단계** 를 다룬다.

---

## 1. 시스템 구성 (4개)

| 시스템 | 기술 스택 | 담당 |
|---|---|---|
| **홈페이지** | Next.js | 회사 소개, 기사 모집, 앱 다운로드 유도 |
| **Admin 관리대장** | Next.js | 운영자 전용 웹 (추후 PC 앱 패키징 예정) |
| **사용자 앱** | Flutter | 고객용 |
| **기사 앱** | Flutter | 기사용 |

> 4개 시스템 모두 **하나의 백엔드 API 서버**를 공유한다.

---

## 2. 전체 아키텍처

```
┌─────────────────────────────────────────────┐
│                  Frontend                   │
│                                             │
│  Homepage      Admin Dashboard              │
│  (Next.js)     (Next.js)                    │
│                                             │
│  User App      Driver App                   │
│  (Flutter)     (Flutter)                    │
└────────────────────┬────────────────────────┘
                     │ REST / WebSocket
┌────────────────────▼────────────────────────┐
│               Backend (공통)                │
│                                             │
│  Express + TypeScript                       │
│  Prisma ORM → PostgreSQL                    │
└──────┬──────────────────────┬───────────────┘
       │                      │
  ┌────▼─────┐         ┌──────▼──────┐
  │ AWS RDS  │         │   AWS S3    │
  │(PostgreSQL│         │(이미지 저장) │
  └──────────┘         └─────────────┘

인프라
  - 서버: AWS EC2
  - DB: AWS RDS (PostgreSQL)
  - 파일: AWS S3
  - 도메인/SSL: Cloudflare
```

---

## 3. 홈페이지 (Next.js)

> 마케팅/소개 목적. 백엔드 API 직접 연동 최소화.

| 페이지 | 내용 |
|---|---|
| 메인 랜딩 | 서비스 소개, 앱 다운로드 버튼 |
| 회사 소개 | 팀/서비스 소개 |
| 기사 지원 | 기사 모집 안내 (지원 폼 → Admin으로 연결) |
| 고객 문의 | 고객센터 연락처 |

---

## 4. Admin 관리대장 (Next.js)

### 4.1 권한 구조

```
SUPER_ADMIN   — 전체 권한
OPERATOR      — 콜 관제 담당
ACCOUNTANT    — 정산 담당
```

### 4.2 주요 기능

#### 콜 관리

- 전체 호출 목록 + 상태별 필터
- 상태: `PENDING / MATCHED / ARRIVED / DRIVING / COMPLETED / CANCELLED`
- 호출 상세 정보 확인

#### 기사 관리

- 기사 등록 / 승인 처리 (`PENDING_APPROVAL → APPROVED`)
- 기사 상태 관리 (활성 / 정지 `SUSPENDED`)
- 서류(면허증, 차량등록증) 업로드 관리 → S3 저장

#### 사용자 관리

- 이용 내역 조회
- 블랙리스트 관리

#### 정산 관리

- 기사 수익 집계
- 수수료 계산 (`Settlement.commissionRate` 기반)
- 월별 정산 리포트
- 엑셀 다운로드

#### 로그 / 감사 기록

- 취소 사유 (`RideCancelLog`)
- 패널티 기록 (`DriverPenalty`)
- 관리자 조작 기록

---

## 5. 개발 단계 계획

| 단계 | 내용 |
|---|---|
| **1단계** | 홈페이지 + Admin 관리대장 기본 UI 구축 |
| **2단계** | DB 설계(Prisma) + API 구축 |
| **3단계** | 사용자 앱 UI → API 연결 |
| **4단계** | 기사 앱 연결 |
| **5단계** | 실시간 상태 동기화 (Polling → WebSocket 전환) |
| **6단계** | 정산 시스템 완성 |

---

## 6. 공통 사항

- **API 서버 단일 진입점**: 모든 클라이언트(홈페이지/Admin/앱)가 동일 서버 사용
- **인증**: JWT Bearer — 역할(`USER/DRIVER/ADMIN`)에 따라 엔드포인트 접근 제어
- **이미지**: 기사 서류, 프로필 등 → S3 업로드, URL만 DB 저장
- **Admin 권한 분리**: API 레벨에서 `SUPER_ADMIN / OPERATOR / ACCOUNTANT` 미들웨어 적용 필요
