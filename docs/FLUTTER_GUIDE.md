# RIDE Flutter App — 개발 가이드

> **참조**: 전체 스펙은 `SPEC.md` 기준. DB 스키마는 `SPEC.md Appendix C` 참조.
> **대상**: 고객 앱 / 기사 앱 공통 적용.
> **목표**: 화면보다 상태머신 + 네트워크 + 실시간 처리를 안정적으로 붙이는 것.
> **v0.2**: DB 스키마 반영 — enum 확정, 모델 필드 반영.

---

## Table of Contents

1. [개발 환경 준비](#1-개발-환경-준비)
2. [프로젝트 구성 전략](#2-프로젝트-구성-전략)
3. [폴더 구조](#3-폴더-구조)
4. [핵심 라이브러리](#4-핵심-라이브러리)
5. [환경변수 관리](#5-환경변수-관리)
6. [네트워크 레이어](#6-네트워크-레이어)
7. [인증 토큰 처리](#7-인증-토큰-처리)
8. [상태머신 연결](#8-상태머신-연결)
9. [WebSocket 실시간 처리](#9-websocket-실시간-처리)
10. [지도 / GPS](#10-지도--gps)
11. [결제 구현 순서](#11-결제-구현-순서)
12. [MVP 개발 순서](#12-mvp-개발-순서)
13. [Cursor AI 시작 프롬프트](#13-cursor-ai-시작-프롬프트)

---

## 1. 개발 환경 준비

### 1.1 필수 설치

| 도구 | 비고 |
|---|---|
| Flutter SDK (stable) | `flutter.dev` |
| Android Studio | Android SDK 포함 |
| Xcode | iOS 빌드 시 (Mac 전용) |
| VSCode 또는 Android Studio | Flutter/Dart plugin 설치 |

### 1.2 환경 확인

```bash
flutter doctor
```

체크해야 할 항목:

- ✅ Flutter (stable channel)
- ✅ Android toolchain
- ✅ Xcode (iOS 필요 시)
- ✅ Connected device / emulator

---

## 2. 프로젝트 구성 전략

### 선택지

#### A안 — 앱 2개 독립 프로젝트

```
customer_app/
driver_app/
```

- 장점: 배포/설정 완전 분리, 단순
- 단점: 공통 코드 중복 발생

#### B안 — 모노레포 (권장)

```
apps/
  customer_app/
  driver_app/
packages/
  core/      ← API client, 모델, 공통 유틸
  ui/        ← 공통 위젯, 테마
```

- 장점: 공통 코드 단일 관리, 장기 유지보수 유리
- 단점: 초기 세팅 비용

> **권장**: B안으로 시작. 나중에 분리하는 것보다 처음부터 구조 잡는 게 낫다.

---

## 3. 폴더 구조

```
lib/
├── app/
│   ├── router.dart          # go_router 라우트 정의
│   ├── theme.dart           # 앱 테마 (색상, 타이포)
│   └── di.dart              # Provider 등록 (Riverpod ProviderScope)
│
├── core/
│   ├── config/
│   │   └── env.dart         # --dart-define 환경변수
│   ├── network/
│   │   ├── dio_client.dart  # Dio 인스턴스 + 공통 설정
│   │   ├── interceptors.dart # Auth / Error 인터셉터
│   │   └── ws_client.dart   # WebSocket 연결 관리
│   ├── storage/
│   │   └── secure_storage.dart  # flutter_secure_storage 래퍼
│   ├── models/
│   │   ├── ride.dart        # Ride, RideStatus
│   │   ├── user.dart
│   │   ├── driver.dart
│   │   └── payment.dart
│   └── repos/
│       ├── auth_repo.dart
│       ├── ride_repo.dart
│       └── payment_repo.dart
│
├── features/
│   ├── auth/
│   │   ├── view/
│   │   └── state/
│   ├── ride/
│   │   ├── view/
│   │   └── state/           # RideNotifier
│   ├── history/
│   │   ├── view/
│   │   └── state/
│   └── support/
│       ├── view/
│       └── state/
│
└── main.dart
```

### 규칙

- `view/` — Widget만. 비즈니스 로직 없음.
- `state/` — Notifier / StateNotifier. API 호출은 Repo 통해서만.
- `core/repos/` — 네트워크 호출 전담. 화면에서 직접 호출 금지.

---

## 4. 핵심 라이브러리

### pubspec.yaml 의존성 목록

```yaml
dependencies:
  flutter:
    sdk: flutter

  # 상태관리
  flutter_riverpod: ^2.x.x
  riverpod_annotation: ^2.x.x

  # 네트워크
  dio: ^5.x.x

  # 라우팅
  go_router: ^14.x.x

  # 보안 저장소
  flutter_secure_storage: ^9.x.x

  # 모델/직렬화
  freezed_annotation: ^2.x.x
  json_annotation: ^4.x.x

  # WebSocket
  web_socket_channel: ^3.x.x
  # ※ 서버가 Socket.IO라면 socket_io_client 사용

  # Firebase (FCM)
  firebase_core: ^3.x.x
  firebase_messaging: ^15.x.x

  # 환경변수
  # --dart-define 방식 사용 (별도 패키지 불필요)

dev_dependencies:
  build_runner: ^2.x.x
  freezed: ^2.x.x
  json_serializable: ^6.x.x
  riverpod_generator: ^2.x.x
```

> **버전**: 작성 시점 기준 major만 표기. 실제 추가 시 `flutter pub add <package>` 로 최신 버전 설치.

---

## 5. 환경변수 관리

### 5.1 --dart-define 방식

```bash
# 개발
flutter run \
  --dart-define=API_BASE_URL=https://api.dev.ride.kr \
  --dart-define=WS_BASE_URL=wss://ws.dev.ride.kr \
  --dart-define=MAP_API_KEY=xxx

# 빌드
flutter build apk \
  --dart-define=API_BASE_URL=https://api.ride.kr \
  --dart-define=WS_BASE_URL=wss://ws.ride.kr \
  --dart-define=MAP_API_KEY=xxx
```

### 5.2 env.dart

```dart
// lib/core/config/env.dart
class Env {
  static const apiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const wsBaseUrl  = String.fromEnvironment('WS_BASE_URL');
  static const mapApiKey  = String.fromEnvironment('MAP_API_KEY');

  // 런타임 검증 (앱 시작 시 호출)
  static void validate() {
    assert(apiBaseUrl.isNotEmpty, 'API_BASE_URL is not set');
    assert(wsBaseUrl.isNotEmpty,  'WS_BASE_URL is not set');
  }
}
```

### 5.3 Flavor별 launch configuration (VSCode)

```jsonc
// .vscode/launch.json
{
  "configurations": [
    {
      "name": "dev (customer)",
      "request": "launch",
      "type": "dart",
      "args": [
        "--dart-define=API_BASE_URL=https://api.dev.ride.kr",
        "--dart-define=WS_BASE_URL=wss://ws.dev.ride.kr"
      ]
    },
    {
      "name": "prod (customer)",
      "request": "launch",
      "type": "dart",
      "args": [
        "--dart-define=API_BASE_URL=https://api.ride.kr",
        "--dart-define=WS_BASE_URL=wss://ws.ride.kr"
      ]
    }
  ]
}
```

---

## 6. 네트워크 레이어

### 6.1 Dio 클라이언트

```dart
// lib/core/network/dio_client.dart
Dio createDio(SecureStorageService storage) {
  final dio = Dio(
    BaseOptions(
      baseUrl: Env.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ),
  );

  dio.interceptors.addAll([
    AuthInterceptor(dio, storage),  // 토큰 주입 + 401 처리
    LogInterceptor(responseBody: true),
  ]);

  return dio;
}
```

### 6.2 AuthInterceptor 핵심 로직

```dart
// lib/core/network/interceptors.dart
@override
Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
  if (err.response?.statusCode == 401) {
    // 1. refresh 시도
    final refreshed = await _tryRefresh();
    if (refreshed) {
      // 2. 원래 요청 재시도
      final retried = await _retry(err.requestOptions);
      return handler.resolve(retried);
    } else {
      // 3. 로그아웃 처리
      await _storage.clearTokens();
      // router.go('/login') — 전역 라우터 참조 필요
    }
  }
  handler.next(err);
}
```

### 6.3 API 호출 원칙

```
화면(Widget)
    ↓ ref.watch / ref.read
Notifier (state/)
    ↓ 메서드 호출
Repository (core/repos/)
    ↓ Dio 호출
API 서버
```

- 화면 → Notifier → Repo 단방향 흐름 유지
- Repo는 `Either<Failure, T>` 또는 `Result<T>` 패턴 사용 권장

---

## 7. 인증 토큰 처리

### 7.1 SecureStorage 래퍼

```dart
// lib/core/storage/secure_storage.dart
class SecureStorageService {
  static const _accessKey  = 'access_token';
  static const _refreshKey = 'refresh_token';
  static const _rideIdKey  = 'last_ride_id';

  final FlutterSecureStorage _storage;

  Future<String?> getAccessToken()  => _storage.read(key: _accessKey);
  Future<String?> getRefreshToken() => _storage.read(key: _refreshKey);
  Future<void> saveTokens({required String access, required String refresh}) async {
    await _storage.write(key: _accessKey,  value: access);
    await _storage.write(key: _refreshKey, value: refresh);
  }
  Future<void> clearTokens() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
  }

  // 앱 재시작 후 진행 중 라이드 복구용
  Future<String?> getLastRideId()            => _storage.read(key: _rideIdKey);
  Future<void> saveLastRideId(String rideId) => _storage.write(key: _rideIdKey, value: rideId);
  Future<void> clearLastRideId()             => _storage.delete(key: _rideIdKey);
}
```

### 7.2 앱 시작 복구 플로우

```
main()
  └─ Env.validate()
  └─ SecureStorage.getAccessToken()
       ├─ 있음 → AuthRepo.verify() or 바로 진입
       └─ 없음 → /login
             └─ SecureStorage.getLastRideId()
                  ├─ 있음 → GET /rides/{id}
                  │          ├─ status.isActive (PENDING/MATCHED/ACCEPTED/ARRIVED/DRIVING)
                  │          │       → /ride/progress
                  │          └─ status.isTerminal (COMPLETED/CANCELLED/FAILED)
                  │                  → /home
                  └─ 없음 → /home
```

---

## 8. 상태머신 연결

### 8.1 RideStatus Enum (DB 확정)

```dart
// lib/core/models/ride.dart
enum RideStatus {
  pending,    // 호출 생성 → 기사 매칭 대기
  matched,    // 기사 매칭됨 → 이동 중
  accepted,   // 기사 콜 수락 완료
  arrived,    // 기사 픽업 위치 도착
  driving,    // 운행 중
  completed,  // 운행 완료
  cancelled,  // 취소 (cancelledBy 필드로 주체 확인)
  failed;     // 배차 실패

  static RideStatus fromJson(String value) =>
      RideStatus.values.firstWhere(
        (e) => e.name.toUpperCase() == value.toUpperCase(),
        orElse: () => throw Exception('Unknown RideStatus: $value'),
      );

  bool get isActive => switch (this) {
    pending || matched || accepted || arrived || driving => true,
    _ => false,
  };

  bool get isTerminal => switch (this) {
    completed || cancelled || failed => true,
    _ => false,
  };
}

enum RideType { premium, quick, normal }

enum PaymentMethod { card, cash, mileage }

enum PaymentStatus { pending, paid, failed, refunded }

enum DriverStatus { offline, online, busy }

enum DriverApprovalStatus { pendingApproval, approved, rejected, suspended }

enum CancelledBy { user, driver, system, admin }
```

### 8.2 화면 매핑 규칙

```dart
// RideStatus에 따른 화면 분기
Widget buildByStatus(RideStatus status) {
  return switch (status) {
    RideStatus.pending                    => const WaitingSection(),      // 배차 대기
    RideStatus.matched ||
    RideStatus.accepted                   => const DriverTrackingSection(), // 기사 이동 중
    RideStatus.arrived                    => const DriverArrivedSection(), // 기사 도착
    RideStatus.driving                    => const DrivingSection(),       // 운행 중
    RideStatus.completed                  => const CompletedSection(),     // 완료
    RideStatus.cancelled ||
    RideStatus.failed                     => const CancelledSection(),     // 취소/실패
  };
}
```

### 8.3 RideNotifier 뼈대

```dart
// lib/features/ride/state/ride_notifier.dart
@riverpod
class RideNotifier extends _$RideNotifier {
  @override
  AsyncValue<Ride?> build() => const AsyncValue.data(null);

  Future<void> createRide(CreateRideRequest req) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final ride = await ref.read(rideRepoProvider).createRide(req);
      await ref.read(secureStorageProvider).saveLastRideId(ride.id);
      _connectWebSocket(ride.id);
      return ride;
    });
  }

  Future<void> fetchRideDetail(String rideId) async {
    state = await AsyncValue.guard(
      () => ref.read(rideRepoProvider).getRide(rideId),
    );
  }

  Future<void> cancelRide(String rideId) async {
    await ref.read(rideRepoProvider).cancelRide(rideId);
    await fetchRideDetail(rideId);  // 서버 상태 재조회
  }

  // WebSocket 이벤트로 상태 갱신
  void onStatusChanged(String rideId, RideStatus newStatus) {
    state.whenData((ride) {
      if (ride?.id == rideId) {
        state = AsyncValue.data(ride!.copyWith(status: newStatus));
        // 필요 시 서버 동기화
        if (_requiresSync(newStatus)) fetchRideDetail(rideId);
      }
    });
  }

  bool _requiresSync(RideStatus status) => status.isTerminal;

  void _connectWebSocket(String rideId) {
    ref.read(wsClientProvider).connect(onStatusChanged: onStatusChanged);
  }
}
```

---

## 9. WebSocket 실시간 처리

### 9.1 연결 시점

```
MVP 기준:
  호출 생성 성공(createRide) 시점에 연결
  COMPLETED / CANCELLED / FAILED 수신 시 연결 해제 (status.isTerminal)
```

### 9.2 WsClient 뼈대

```dart
// lib/core/network/ws_client.dart
class WsClient {
  WebSocketChannel? _channel;
  Timer? _reconnectTimer;
  int _retryCount = 0;

  void connect({
    required void Function(String rideId, RideStatus status) onStatusChanged,
  }) {
    final uri = Uri.parse(
      '${Env.wsBaseUrl}?token=$accessToken',  // ⚠️ 인증 방식 BE 확정 필요
    );
    _channel = WebSocketChannel.connect(uri);

    _channel!.stream.listen(
      (data) => _handleEvent(data, onStatusChanged),
      onError: (_) => _scheduleReconnect(onStatusChanged),
      onDone:  () => _scheduleReconnect(onStatusChanged),
    );
  }

  void _handleEvent(dynamic data, Function onStatusChanged) {
    final json = jsonDecode(data as String) as Map<String, dynamic>;
    final event = json['event'] as String;

    switch (event) {
      case 'ride.status_changed':
        final payload = json['payload'] as Map<String, dynamic>;
        onStatusChanged(
          payload['rideId'] as String,
          RideStatus.fromJson(payload['status'] as String),
        );
      // 추가 이벤트 처리...
    }
  }

  void _scheduleReconnect(Function onStatusChanged) {
    final delay = Duration(seconds: _backoffSeconds());
    _reconnectTimer = Timer(delay, () => connect(onStatusChanged: onStatusChanged));
    _retryCount++;
  }

  int _backoffSeconds() => min(30, 1 * pow(2, _retryCount).toInt());

  void disconnect() {
    _reconnectTimer?.cancel();
    _channel?.sink.close();
    _channel = null;
    _retryCount = 0;
  }
}
```

> ⚠️ WS 인증 방식(query param vs header) — `SPEC.md 섹션 13 #2` 확정 후 수정.

### 9.3 실시간 처리 원칙

```
WS 이벤트 수신
  ├─ 로컬 상태 즉시 갱신 (UX)
  └─ 중요 상태(COMPLETED/FAILED)는 반드시 GET /rides/{id} 재조회로 정합성 확인

이벤트 누락 대비:
  - 주기적 폴링 OR
  - 화면 포그라운드 복귀 시 fetchRideDetail() 호출
```

---

## 10. 지도 / GPS

### 10.1 지도 SDK

> ⚠️ 카카오맵 / 네이버맵 / 구글맵 중 확정 필요 (`SPEC.md 섹션 13 #8`)

### 10.2 위치 권한 처리

```dart
// permission_handler 패키지 사용
Future<bool> requestLocationPermission() async {
  var status = await Permission.locationWhenInUse.status;

  if (status.isDenied) {
    status = await Permission.locationWhenInUse.request();
  }

  if (status.isPermanentlyDenied) {
    // 설정 앱 안내 UI 표시
    await openAppSettings();
    return false;
  }

  return status.isGranted;
}
```

### 10.3 기사 앱 — 위치 업로드

```dart
// MVP: 포그라운드만 구현 (백그라운드는 2차)
Timer.periodic(const Duration(seconds: 5), (_) async {
  final pos = await Geolocator.getCurrentPosition();
  await ref.read(rideRepoProvider).updateDriverLocation(
    lat: pos.latitude,
    lng: pos.longitude,
  );
});
```

> ⚠️ 업데이트 주기/정책 BE 확정 필요 (`SPEC.md 섹션 13 #6`)

### 10.4 고객 앱 — 기사 위치 수신

```dart
// WS 이벤트: driver.location_updated
case 'driver.location_updated':
  final payload = json['payload'];
  ref.read(mapNotifierProvider.notifier).updateDriverMarker(
    lat: payload['lat'],
    lng: payload['lng'],
    heading: payload['heading'],
  );
```

---

## 11. 결제 구현 순서

단계적으로 구현. 한 번에 다 하지 않는다.

| 단계 | 내용 |
|---|---|
| 1차 (MVP) | **현금만** — 결제수단 선택 UI + 서버에 `CASH` 전달 |
| 2차 | **마일리지(`MILEAGE`)** — `User.mileageBalance` 조회 + 부족 시 현금/카드 유도 |
| 3차 | **카드/PG 연동** — 카드 등록, 승인 API, 실패 재시도 |

### 결제 실패 필수 UX

```dart
// 재시도 버튼 필수 제공
onPaymentError: (error) {
  showRetryBottomSheet(
    message: '결제에 실패했습니다.',
    onRetry: () => ref.read(paymentProvider.notifier).approvePayment(rideId),
    onChangeMethod: () => router.push('/payment-select'),
  );
}
```

---

## 12. MVP 개발 순서

### 1주차

- [ ] 프로젝트 생성 + 폴더 구조 세팅
- [ ] Dio 클라이언트 + AuthInterceptor
- [ ] SecureStorage 토큰 저장/로드
- [ ] 로그인 화면 + AuthRepo
- [ ] 호출 생성 API 연결 (CreateRide)
- [ ] 호출 상세 조회 (GET /rides/{id})
- [ ] RideStatusScreen — 상태별 UI placeholder

### 2주차

- [ ] WebSocket 연결 + ride.status_changed 이벤트 처리
- [ ] 고객 앱: 배차됨/도착중 화면 (기사 정보 표시)
- [ ] 기사 앱: 콜 리스트 + 수락/거절
- [ ] 기사 앱: 픽업 도착 / 운행 시작 / 완료 버튼
- [ ] 운행 완료 화면 + 현금 결제 처리
- [ ] 운행 내역 목록 (cursor 페이지네이션)

---

## 13. Cursor AI 시작 프롬프트

아래를 그대로 Cursor AI에 붙여넣고 시작.

```
Flutter로 대리운전 앱 MVP 구조를 만들어줘.

스택:
- 상태관리: Riverpod (riverpod_generator)
- 네트워크: Dio
- 라우팅: go_router
- 보안 저장: flutter_secure_storage
- 모델: freezed + json_serializable

폴더 구조:
- lib/app/ (router, theme, di)
- lib/core/config/, network/, storage/, models/, repos/
- lib/features/auth/, ride/, history/, support/ (각각 view/, state/ 하위)

환경변수:
- --dart-define 방식 (API_BASE_URL, WS_BASE_URL)
- lib/core/config/env.dart 에서 Env 클래스로 관리

RideStatus enum (DB 확정):
PENDING / MATCHED / ACCEPTED / ARRIVED / DRIVING / COMPLETED / CANCELLED / FAILED

구현 요청:
1. Dio 클라이언트 (dio_client.dart) — baseUrl, timeout, AuthInterceptor (401 처리 포함)
2. SecureStorageService — access/refresh token + lastRideId 저장/조회
3. AuthRepo — login(), refresh(), logout() 뼈대
4. RideRepo — createRide(), getRide(id), cancelRide(id) 뼈대
5. RideNotifier (Riverpod) — createRide(), fetchRideDetail(), cancelRide(), onStatusChanged() 구현
6. WsClient — 연결/재연결(backoff) + ride.status_changed 이벤트 → RideNotifier 상태 갱신
7. 화면 2개 (placeholder OK):
   - HomeScreen (지도 placeholder + 호출 버튼)
   - RideStatusScreen (RideStatus에 따라 섹션 분기)
8. go_router 기본 라우트 (/login, /home, /ride/:id)
```

---

## Appendix A — 체크리스트 (개발 시작 전)

- [x] Ride status enum 철자/케이스 확인 (`SPEC.md Appendix C` 참조)
- [x] PaymentMethod / PaymentStatus enum 확인
- [ ] WS 인증 방식 확정 (`SPEC.md 섹션 13 #8`)
- [ ] WS 이벤트 이름 확정
- [ ] 지도 SDK 선택 완료
- [ ] dev/stg/prod API URL 수령
- [ ] FCM 설정 파일 (`google-services.json` / `GoogleService-Info.plist`) 수령

---

## Appendix B — Dart 모델 뼈대 (freezed 기준)

DB 스키마 기반. `build_runner` 실행 전 뼈대 코드.

### ride.dart

```dart
// lib/core/models/ride.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'ride.freezed.dart';
part 'ride.g.dart';

@freezed
class Ride with _$Ride {
  const factory Ride({
    required String id,
    required RideStatus status,
    required RideType type,
    required String userId,
    String? driverId,
    required double pickupLat,
    required double pickupLng,
    required String pickupAddress,
    required double dropoffLat,
    required double dropoffLng,
    required String dropoffAddress,
    required int estimatedFare,
    required double estimatedDistance,
    required int estimatedDuration,
    int? actualFare,
    double? actualDistance,
    required PaymentMethod paymentMethod,
    String? cardId,
    CancelledBy? cancelledBy,
    String? cancelReason,
    int? cancellationFee,
    required DateTime createdAt,
    DateTime? acceptedAt,
    DateTime? arrivedAt,
    DateTime? startedAt,
    DateTime? completedAt,
    DateTime? cancelledAt,
    // 상세 조회 시 포함될 수 있는 nested 객체
    RideDriver? driver,
    RidePayment? payment,
  }) = _Ride;

  factory Ride.fromJson(Map<String, dynamic> json) => _$RideFromJson(json);
}

// 라이드 응답에 포함되는 기사 정보 (간략)
@freezed
class RideDriver with _$RideDriver {
  const factory RideDriver({
    required String id,
    required String name,
    required String phone,
    required String vehicleNumber,
    required String vehicleModel,
    double? currentLat,
    double? currentLng,
    required double rating,
  }) = _RideDriver;

  factory RideDriver.fromJson(Map<String, dynamic> json) => _$RideDriverFromJson(json);
}

// 라이드 응답에 포함되는 결제 정보 (간략)
@freezed
class RidePayment with _$RidePayment {
  const factory RidePayment({
    required String id,
    required PaymentMethod method,
    required PaymentStatus status,
    required int amount,
    String? cardName,
    String? cardLast4,
    int? refundAmount,
  }) = _RidePayment;

  factory RidePayment.fromJson(Map<String, dynamic> json) => _$RidePaymentFromJson(json);
}
```

### user.dart

```dart
// lib/core/models/user.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
class AppUser with _$AppUser {
  const factory AppUser({
    required String id,
    required String phone,
    required String name,
    required int mileageBalance,
    required String referralCode,
  }) = _AppUser;

  factory AppUser.fromJson(Map<String, dynamic> json) => _$AppUserFromJson(json);
}

@freezed
class Card with _$Card {
  const factory Card({
    required String id,
    required String cardName,
    required String last4,
    required bool isDefault,
  }) = _Card;

  factory Card.fromJson(Map<String, dynamic> json) => _$CardFromJson(json);
}
```

### driver.dart

```dart
// lib/core/models/driver.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'driver.freezed.dart';
part 'driver.g.dart';

@freezed
class Driver with _$Driver {
  const factory Driver({
    required String id,
    required String phone,
    required String name,
    required DriverApprovalStatus approvalStatus,
    required DriverStatus status,
    required String vehicleNumber,
    required String vehicleModel,
    required int vehicleYear,
    double? currentLat,
    double? currentLng,
    required double rating,
    required int totalRides,
    required int penaltyCount,
  }) = _Driver;

  factory Driver.fromJson(Map<String, dynamic> json) => _$DriverFromJson(json);
}
```

### create_ride_request.dart

```dart
// lib/core/models/create_ride_request.dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'create_ride_request.freezed.dart';
part 'create_ride_request.g.dart';

@freezed
class CreateRideRequest with _$CreateRideRequest {
  const factory CreateRideRequest({
    required double pickupLat,
    required double pickupLng,
    required String pickupAddress,
    required double dropoffLat,
    required double dropoffLng,
    required String dropoffAddress,
    required RideType type,
    required PaymentMethod paymentMethod,
    String? cardId,  // paymentMethod == CARD 일 때만
  }) = _CreateRideRequest;

  factory CreateRideRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateRideRequestFromJson(json);
}
```

### codegen 실행

```bash
dart run build_runner build --delete-conflicting-outputs
```

---

*v0.2 — DB 스키마 반영 완료.*
