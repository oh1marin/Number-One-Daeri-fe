# RIDE Flutter App — FE Technical Specification

> **Status**: Draft v0.2 | Last updated: 2026-03-04 (DB 스키마 반영)
> **Platforms**: Flutter (iOS / Android)
> **Backend**: REST API + WebSocket + FCM push

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [App Structure](#2-app-structure)
3. [Auth & Account](#3-auth--account)
4. [Ride State Machine](#4-ride-state-machine)
5. [REST API Contract](#5-rest-api-contract)
6. [WebSocket Contract](#6-websocket-contract)
7. [Map & GPS](#7-map--gps)
8. [Payment](#8-payment)
9. [Error Handling & UX Rules](#9-error-handling--ux-rules)
10. [Local Storage & Cache](#10-local-storage--cache)
11. [Environment Config](#11-environment-config)
12. [Test Checklist](#12-test-checklist)
13. [Open Questions (BE Confirmation Required)](#13-open-questions-be-confirmation-required)

---

## 1. Project Overview

| Item | Value |
|---|---|
| Purpose | 고객/기사 앱: 호출 → 배차 → 운행 → 결제/완료 흐름 |
| Platform | Flutter (iOS + Android) |
| Backend transport | REST (primary), WebSocket (real-time), FCM (push) |
| Auth | JWT Bearer |

---

## 2. App Structure

### 2.1 Customer App — Screen List

| Screen | Description |
|---|---|
| `HomeMapScreen` | 지도 + 출발/도착 입력 |
| `RideOptionScreen` | 요금 옵션 선택 (프리미엄 / 빠른 / 일반) |
| `PaymentSelectScreen` | 결제수단 선택 (현금 / 포인트 / 카드) |
| `RideProgressScreen` | 호출 진행 상태 (대기→배차→도착→운행→완료) |
| `RideHistoryScreen` | 운행내역 / 영수증 |
| `CardManageScreen` | 카드 등록 / 관리 |
| `CouponMileageScreen` | 쿠폰 / 마일리지 |
| `SupportScreen` | 고객센터 (1:1 문의) |

### 2.2 Driver App — Screen List

| Screen | Description |
|---|---|
| `DriverLoginScreen` | 로그인 / 승인 상태 확인 |
| `DriverHomeScreen` | 온라인(대기) 토글 |
| `OfferListScreen` | 콜 리스트 / 푸시 수신 |
| `OfferDetailScreen` | 콜 수락 / 거절 |
| `RideActiveScreen` | 픽업 도착 / 운행 시작 / 운행 완료 처리 |
| `SettlementScreen` | 정산 내역 |

---

## 3. Auth & Account

### 3.1 User Types

```
Role enum (DB 확정)
  USER    — 고객 앱 사용자 (model: User)
  DRIVER  — 기사 앱 사용자 (model: Driver)
  ADMIN   — 웹 전용 (Flutter 앱 X)
```

> **Note**: DB의 `User` 모델과 `Driver` 모델은 완전히 별개 테이블. 같은 전화번호로 두 역할을 동시에 가질 수 없다.

### 3.2 Authentication Flow

```
[App Start]
  └─ Read token from SecureStorage
       ├─ Valid  → proceed
       └─ Expired / Missing
              ├─ Refresh attempt  → success → proceed
              └─ Refresh fail     → Logout + navigate to Login
```

#### Token Storage

| Data | Storage |
|---|---|
| Access Token | `flutter_secure_storage` |
| Refresh Token | `flutter_secure_storage` |

#### HTTP Header

```
Authorization: Bearer <accessToken>
```

#### 401 Interceptor Logic (Dio / http)

1. Request fails with `401`
2. Attempt `POST /auth/refresh` with refresh token
3. Success → retry original request with new access token
4. Fail → clear storage → navigate to Login

---

## 4. Ride State Machine

> **DB 확정**: `RideStatus` enum은 Prisma 스키마 기준.

### 4.1 RideStatus Enum (확정)

```
PENDING     — 호출 생성됨 (기사 매칭 대기)
MATCHED     — 기사 매칭됨 (기사 이동 중)
ACCEPTED    — 기사가 콜 수락 완료
ARRIVED     — 기사 픽업 위치 도착
DRIVING     — 운행 중
COMPLETED   — 운행 완료  ✅
CANCELLED   — 취소 (cancelledBy: USER | DRIVER | SYSTEM | ADMIN)  ❌
FAILED      — 배차 실패 / 타임아웃  ❌
```

### 4.2 Customer-side 상태 흐름

```
PENDING
  └─→ MATCHED        (기사 매칭 → 기사 이동 중, driver.currentLat/Lng 갱신 시작)
        ├─→ ACCEPTED  (기사 콜 수락)
        │     └─→ ARRIVED    (기사 픽업 도착, arrivedAt 기록)
        │           └─→ DRIVING    (운행 시작, startedAt 기록)
        │                 └─→ COMPLETED  (운행 완료, completedAt 기록)  ✅
        ├─→ FAILED    (배차 실패 / 타임아웃)                            ❌
        └─→ CANCELLED (취소, cancelledAt + cancelledBy 기록)            ❌
```

#### State → Screen / Button Mapping

| Status | Screen | Primary Button | 취소 가능 |
|---|---|---|---|
| `PENDING` | `RideProgressScreen` | — | ✅ (수수료 없음) |
| `MATCHED` | `RideProgressScreen` | 지도에서 기사 위치 확인 | ✅ (수수료 정책 확인 필요) |
| `ACCEPTED` | `RideProgressScreen` | 지도에서 기사 위치 확인 | ✅ (수수료 발생 가능) |
| `ARRIVED` | `RideProgressScreen` | (안내 메시지만) | ❌ |
| `DRIVING` | `RideProgressScreen` | (운행 중 안내) | ❌ |
| `COMPLETED` | `RideCompleteScreen` | 영수증 보기 | ❌ |
| `CANCELLED` | `HomeMapScreen` | 다시 호출 | — |
| `FAILED` | `HomeMapScreen` | 다시 호출 | — |

> **Rule**: 버튼은 서버 응답 성공 후 상태 전환. 낙관적 업데이트 최소화.
> **Rule**: 상태 단일 소스 = `rideDetail` (GET /rides/{rideId}).
> **Note**: `cancelledBy` 필드로 누가 취소했는지 구분 → 취소 사유 메시지 분기.

### 4.3 Driver-side States

```
DriverStatus enum (확정)
  OFFLINE  — 오프라인
  ONLINE   — 대기 중 (콜 수신 가능)
  BUSY     — 운행 중

DriverApprovalStatus enum (확정)
  PENDING_APPROVAL — 승인 대기
  APPROVED         — 승인 완료 (앱 사용 가능)
  REJECTED         — 승인 거절
  SUSPENDED        — 정지

[Driver 콜 흐름]
  ONLINE → (ride.offered 수신) → ACCEPTED → ARRIVED → DRIVING → COMPLETED
                                           → BUSY (상태 자동 변경)
```

#### DriverApprovalStatus별 FE 처리

| approvalStatus | FE 처리 |
|---|---|
| `PENDING_APPROVAL` | "심사 중" 안내 화면, 기능 잠금 |
| `APPROVED` | 정상 사용 |
| `REJECTED` | "승인 거절" 안내 + 사유 표시 |
| `SUSPENDED` | "계정 정지" 안내 + 고객센터 연결 |

---

## 5. REST API Contract

> 실제 endpoint / field 명은 BE 명세 확정본 기준. 아래는 FE 구현에 필요한 종류 목록.

### 5.1 Customer Endpoints

| Method | Path | Description | Notes |
|---|---|---|---|
| `POST` | `/rides` | 호출 생성 | body: 출발/도착/옵션/결제수단 |
| `GET` | `/rides/{rideId}` | 호출 상세 | 상태 단일 소스 |
| `POST` | `/rides/{rideId}/cancel` | 호출 취소 | |
| `GET` | `/users/me/rides` | 운행 내역 | `?cursor=...` pagination |
| `GET` | `/users/me/payments` | 결제수단 목록 | |
| `POST` | `/payments/cards` | 카드 등록 | |
| `POST` | `/payments/{rideId}/approve` | 결제 승인 | |
| `GET` | `/users/me/mileage` | 마일리지 조회 | |
| `GET` | `/users/me/coupons` | 쿠폰 목록 | |
| `POST` | `/support/inquiries` | 1:1 문의 등록 | |

### 5.2 Driver Endpoints

| Method | Path | Description | Notes |
|---|---|---|---|
| `POST` | `/drivers/me/online` | 온라인 전환 | |
| `POST` | `/drivers/me/offline` | 오프라인 전환 | |
| `GET` | `/drivers/me/offers` | 콜 목록 | |
| `POST` | `/rides/{rideId}/accept` | 콜 수락 | |
| `POST` | `/rides/{rideId}/reject` | 콜 거절 | |
| `POST` | `/rides/{rideId}/arrived` | 픽업 도착 처리 | |
| `POST` | `/rides/{rideId}/start` | 운행 시작 | |
| `POST` | `/rides/{rideId}/complete` | 운행 완료 | |
| `GET` | `/drivers/me/settlements` | 정산 조회 | `?from=...&to=...` |

### 5.3 Common Response Format

```jsonc
// Success
{
  "data": { ... }
}

// Error
{
  "code": "RIDE_ALREADY_ACCEPTED",
  "message": "이미 다른 기사가 수락한 콜입니다.",
  "detail": { ... }   // optional
}
```

---

## 6. WebSocket Contract

### 6.1 Connection

| Item | Value |
|---|---|
| URL | `wss://{WS_BASE_URL}/ws` |
| Auth | 연결 시 토큰 전달 — **방식 미확정** (query param or header) |
| Reconnect | 네트워크 끊김 시 exponential backoff 재시도 |

#### Reconnect Strategy (예시)

```
base delay: 1s
max delay:  30s
multiplier: 2x
jitter:     ±20%
```

### 6.2 Events

#### Customer Receives

| Event | Payload | Action |
|---|---|---|
| `ride.status_changed` | `{ rideId, status, updatedAt }` | 로컬 상태 갱신 → 화면 전환 |
| `driver.location_updated` | `{ rideId, lat, lng, heading, updatedAt }` | 지도 마커 갱신 |
| `ride.offer_failed` | `{ rideId, reason }` | FAILED 화면 전환 |

#### Driver Receives

| Event | Payload | Action |
|---|---|---|
| `ride.offered` | `{ rideId, pickup, dropoff, price, expiresAt }` | 콜 수신 알림 + 카운트다운 |
| `ride.canceled_by_customer` | `{ rideId, reason }` | 콜 취소 처리 |

### 6.3 FE Handling Rules

```
WebSocket 이벤트 수신
  ├─ 로컬 상태 즉시 반영 (optimistic UI 허용 범위)
  └─ 필요 시 GET /rides/{rideId} 호출로 정합성 확인
       (이벤트 누락 / 순서 역전 대응)
```

---

## 7. Map & GPS

### 7.1 Map SDK

> **미확정** — 카카오맵 / 네이버맵 / 구글맵 중 1개 확정 필요

### 7.2 Location Permission Flow

```
[App Start / Map Open]
  └─ Request location permission
       ├─ Granted    → start location service
       └─ Denied
             ├─ First deny  → show rationale dialog
             └─ Permanent   → show "설정 > 위치 권한 허용" 안내 + 설정 앱 이동 버튼
```

### 7.3 Location Update Policy

| App | 방식 | 주기 / 조건 |
|---|---|---|
| **Driver** | 서버/WS로 업로드 | 3~5초 또는 이동 거리 기준 — **BE 확정 필요** |
| **Customer** | 수신만 | `driver.location_updated` WS 이벤트로 수신 |

---

## 8. Payment

### 8.1 Payment Methods (DB 확정)

| PaymentMethod | Description |
|---|---|
| `CASH` | 현금 — API 승인 불필요, 완료 시 기록만 |
| `MILEAGE` | 마일리지 — `User.mileageBalance` 차감, 잔액 부족 시 카드/현금 유도 |
| `CARD` | 카드 — PG 연동, `billingKey` 기반 승인, `Payment.impUid`/`merchantUid` 기록 |

#### PaymentStatus (DB 확정)

| Status | Description |
|---|---|
| `PENDING` | 결제 대기 (운행 완료 전) |
| `PAID` | 결제 완료 |
| `FAILED` | 결제 실패 (`failCount`, `lastFailedAt` 기록) |
| `REFUNDED` | 환불 완료 (`refundAmount`, `refundedAt` 기록) |

### 8.2 Card Registration Flow

```
CardManageScreen
  └─ PG SDK 카드 등록 UI
       └─ POST /payments/cards
            ├─ 200 → 목록 갱신
            └─ Error → 에러 메시지 + 재시도
```

### 8.3 Payment Approval Flow

```
COMPLETED 상태 수신
  └─ POST /payments/{rideId}/approve
       ├─ 200 (PaymentStatus: PAID) → RideCompleteScreen (영수증)
       ├─ PG 실패 / 서버 실패 (PaymentStatus: FAILED) → 에러 + 재시도 버튼
       │    └─ failCount 증가 → 일정 횟수 초과 시 고객센터 안내
       └─ 네트워크 실패 → GET /rides/{rideId} 로 PaymentStatus 최종 확인
```

### 8.4 Failure Cases (필수 구현)

| Case | UX |
|---|---|
| PG 실패 | "결제에 실패했습니다. 다시 시도해주세요." + 재시도 버튼 |
| 서버 승인 실패 | 동일 + 고객센터 연결 옵션 |
| 네트워크 실패 | 연결 복구 후 자동 재조회 |

> **Rule**: 결제 최종 상태는 서버가 진실 (GET /rides/{rideId} 또는 GET /users/me/rides 로 확인).

---

## 9. Error Handling & UX Rules

### 9.1 HTTP Error Code Mapping

| Code | Meaning | FE Action |
|---|---|---|
| `400` | 입력값 오류 (출발/도착 누락 등) | field 오류 메시지 표시 |
| `401` | 인증 만료 | refresh → 실패 시 로그아웃 |
| `409` | 상태 충돌 (이미 다른 기사 수락 등) | "이미 처리된 콜입니다." 토스트 |
| `429` | 호출 과다 / rate limit | "잠시 후 다시 시도해주세요." |
| `500` | 서버 오류 | "서버 오류가 발생했습니다. 고객센터에 문의해주세요." |

### 9.2 Toast / Snackbar Message Policy

- 짧고 행동 지향 문구 사용
- 예시: "다시 시도", "결제수단 변경", "위치 권한을 허용해주세요"
- 에러 code를 그대로 노출하지 않음

### 9.3 Double-tap / Duplicate Request Prevention

- 모든 Action 버튼: 요청 중 `loading` 상태 + disabled 처리
- 상태 전환 후 버튼 재활성화 (서버 응답 기준)

---

## 10. Local Storage & Cache

| Data | Storage | Notes |
|---|---|---|
| Access Token | `flutter_secure_storage` | |
| Refresh Token | `flutter_secure_storage` | |
| Last active `rideId` | `flutter_secure_storage` or `SharedPreferences` | 앱 재시작 후 진행 중 라이드 복구용 |
| 목록 캐시 (rides, offers) | in-memory + pagination cursor | pull-to-refresh 제공 |

#### App Restart Recovery Flow

```
[App Start]
  └─ Read lastRideId from storage
       └─ GET /rides/{lastRideId}
            ├─ status in [REQUESTED~DRIVING] → RideProgressScreen
            └─ otherwise → HomeMapScreen
```

---

## 11. Environment Config

| Variable | Description |
|---|---|
| `API_BASE_URL` | REST API base URL |
| `WS_BASE_URL` | WebSocket base URL |
| `MAP_API_KEY` | 지도 SDK API 키 |
| `FCM_SENDER_ID` | FCM sender ID (필요 시) |

#### Flavor / Environment 분리

```
dev   → api.dev.ride.kr  / wss://ws.dev.ride.kr
stg   → api.stg.ride.kr  / wss://ws.stg.ride.kr
prod  → api.ride.kr       / wss://ws.ride.kr
```

> Flutter flavor (`--flavor dev|stg|prod`) + `.env` 파일 분리 권장.

---

## 12. Test Checklist

### Happy Path

- [ ] 호출 생성 → 배차(`PENDING` → `MATCHED`) → 수락(`ACCEPTED`) → 도착(`ARRIVED`) → 운행(`DRIVING`) → 완료(`COMPLETED`)
- [ ] 결제 승인 정상 처리 (PaymentStatus: `PENDING` → `PAID`)

### Cancel Scenarios

- [ ] `PENDING` / `MATCHED` 취소 — `cancelledBy: USER` (수수료 없음)
- [ ] `ACCEPTED` 이후 취소 — 수수료(`cancellationFee`) 발생 여부 확인
- [ ] `cancelledBy: DRIVER` / `SYSTEM` 수신 시 고객 측 UI 처리

### Edge Cases

- [ ] 버튼 연타 방지 (중복 요청 차단)
- [ ] 네트워크 끊김 → 복구 시 상태 재조회
- [ ] 401 처리 (토큰 만료 → refresh → 재시도)
- [ ] WS 이벤트 누락 시 GET /rides/{rideId} 동기화로 복구
- [ ] 위치 권한 거부 시 대체 UI
- [ ] 결제 실패 → 재시도 플로우

---

## 13. Open Questions (BE Confirmation Required)

> ✅ = 스키마로 확정됨 | ⚠️ = 여전히 미확정

| # | 항목 | 상태 | 확정값 / 비고 |
|---|---|---|---|
| 1 | Ride status enum 철자/케이스 | ✅ **확정** | `PENDING/MATCHED/ACCEPTED/ARRIVED/DRIVING/COMPLETED/CANCELLED/FAILED` |
| 2 | PaymentMethod enum | ✅ **확정** | `CARD/CASH/MILEAGE` |
| 3 | PaymentStatus enum | ✅ **확정** | `PENDING/PAID/FAILED/REFUNDED` |
| 4 | DriverStatus enum | ✅ **확정** | `OFFLINE/ONLINE/BUSY` |
| 5 | DriverApprovalStatus enum | ✅ **확정** | `PENDING_APPROVAL/APPROVED/REJECTED/SUSPENDED` |
| 6 | Role enum | ✅ **확정** | `USER/DRIVER/ADMIN` |
| 7 | CancelledBy enum | ✅ **확정** | `USER/DRIVER/SYSTEM/ADMIN` |
| 8 | WebSocket 인증 방식 | ⚠️ **미확정** | query param vs header |
| 9 | WebSocket 이벤트 이름 | ⚠️ **미확정** | 이 문서 기준 (`ride.status_changed` 등) BE 확인 필요 |
| 10 | 배차 실패 타임아웃 기준 (초) | ⚠️ **미확정** | — |
| 11 | 기사 위치 업데이트 주기/정책 | ⚠️ **미확정** | 3~5초 추정 (Driver.currentLat/Lng 갱신 주기) |
| 12 | 취소 수수료/패널티 적용 시점 | ⚠️ **미확정** | `Ride.cancellationFee` 필드는 존재, 계산 로직 미정 |
| 13 | 지도 SDK 선택 | ⚠️ **미확정** | 카카오/네이버/구글 |
| 14 | FCM 페이로드 구조 | ⚠️ **미확정** | — |
| 15 | Refresh token 엔드포인트 | ⚠️ **미확정** | `RefreshToken` 모델 존재, API 경로 확인 필요 |

---

## Appendix A — Ride Status Quick Reference (확정)

```
고객 기준 전체 상태 흐름:
PENDING → MATCHED → ACCEPTED → ARRIVED → DRIVING → COMPLETED  ✅
               ↘ FAILED                                         ❌
               ↘ CANCELLED (어느 단계에서든, cancelledBy로 주체 구분)  ❌

기사 기준 콜 상태:
(ride.offered 수신) → ACCEPTED → ARRIVED → DRIVING → COMPLETED
                    ↘ (거절/만료 시 다음 기사에게 PENDING으로 복귀)
```

#### 타임스탬프 필드 매핑

| 이벤트 | DB 필드 |
|---|---|
| 호출 생성 | `createdAt` |
| 기사 수락 | `acceptedAt` |
| 기사 도착 | `arrivedAt` |
| 운행 시작 | `startedAt` |
| 운행 완료 | `completedAt` |
| 취소 | `cancelledAt` |

## Appendix B — Dependency Candidates (Flutter)

| Purpose | Package |
|---|---|
| HTTP client | `dio` |
| Secure storage | `flutter_secure_storage` |
| WebSocket | `web_socket_channel` |
| State management | Riverpod |
| Map | ⚠️ 미확정 (카카오/네이버/구글) |
| FCM | `firebase_messaging` |
| Env config | `--dart-define` (별도 패키지 불필요) |
| Navigation | `go_router` |
| Model codegen | `freezed` + `json_serializable` |
| Location | `geolocator` |
| Permission | `permission_handler` |

## Appendix C — DB 주요 모델 필드 요약 (FE 참조용)

### Ride

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | String (UUID) | 라이드 ID |
| `status` | RideStatus | 현재 상태 (단일 소스) |
| `type` | RideType | `PREMIUM / QUICK / NORMAL` |
| `userId` | String | 고객 ID |
| `driverId` | String? | 기사 ID (배차 후 채워짐) |
| `pickupLat/Lng` | Float | 출발지 좌표 |
| `pickupAddress` | String | 출발지 주소 |
| `dropoffLat/Lng` | Float | 목적지 좌표 |
| `dropoffAddress` | String | 목적지 주소 |
| `estimatedFare` | Int | 예상 요금 (원) |
| `estimatedDistance` | Float | 예상 거리 (km) |
| `estimatedDuration` | Int | 예상 시간 (분) |
| `actualFare` | Int? | 실제 요금 (완료 후) |
| `paymentMethod` | PaymentMethod | `CARD / CASH / MILEAGE` |
| `cardId` | String? | 카드 결제 시 Card ID |
| `cancelledBy` | CancelledBy? | `USER / DRIVER / SYSTEM / ADMIN` |
| `cancellationFee` | Int? | 취소 수수료 (원) |
| `acceptedAt` | DateTime? | 수락 시각 |
| `arrivedAt` | DateTime? | 도착 시각 |
| `startedAt` | DateTime? | 운행 시작 시각 |
| `completedAt` | DateTime? | 완료 시각 |

### Driver (FE에서 읽는 주요 필드)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | String | 기사 ID |
| `name` | String | 기사 이름 |
| `phone` | String | 연락처 |
| `approvalStatus` | DriverApprovalStatus | 계정 승인 상태 |
| `status` | DriverStatus | `OFFLINE / ONLINE / BUSY` |
| `vehicleNumber` | String | 차량 번호 |
| `vehicleModel` | String | 차종 |
| `currentLat/Lng` | Float? | 현재 위치 (실시간 갱신) |
| `rating` | Float | 평점 (기본 5.0) |
| `totalRides` | Int | 누적 운행 수 |

### Payment (FE에서 읽는 주요 필드)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | String | 결제 ID |
| `rideId` | String | 연결된 라이드 |
| `method` | PaymentMethod | 결제수단 |
| `status` | PaymentStatus | `PENDING / PAID / FAILED / REFUNDED` |
| `amount` | Int | 결제 금액 (원) |
| `cardName` | String? | 카드사 이름 |
| `cardLast4` | String? | 카드 끝 4자리 |
| `refundAmount` | Int? | 환불 금액 |

### User (FE에서 읽는 주요 필드)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | String | 유저 ID |
| `name` | String | 이름 |
| `phone` | String | 전화번호 |
| `mileageBalance` | Int | 마일리지 잔액 (원 단위) |
| `referralCode` | String | 추천인 코드 |

---

*v0.2 — DB 스키마 반영 완료. WS 이벤트 / API 엔드포인트는 BE 명세 확정 후 업데이트.*
