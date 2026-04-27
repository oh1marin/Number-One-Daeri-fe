# Flutter 앱 · 스토어 없이 설치(APK/IPA) 시 API 베이스 URL 설정

스토어 배포 없이 APK/IPA만 설치해 쓰는 경우에도, **앱이 붙는 백엔드 공개 URL만 해당 배포 환경과 맞으면** 동일하게 기능이 동작할 수 있습니다. (앱 스토어 심사와 무관)

---

## 1. 백엔드에서 알아야 할 것

### 공개 API 베이스 URL

- **형식**: `https://<배포-도메인>/api/v1/`
- 이 레포(ride-be) 기준으로 HTTP 라우트는 **`/api/v1`** 아래에 마운트됩니다.

```64:64:src/app.ts
app.use('/api/v1', apiRouter);
```

- **예시 (일등대리 운영)**
  - 프로덕션(도메인): `https://일등대리관리.kr/api/v1/`
    - Punycode: `https://xn--zb0bu7iuubp7hba523s.kr/api/v1/` (DNS·일부 클라이언트용)
  - 프로덕션(IP 직접, HTTP): `http://13.125.156.13/api/v1/` — HTTPS 인증서가 IP에 없을 때만; 앱에서 cleartext 허용 필요할 수 있음
  - 로컬 백엔드: `http://127.0.0.1:5174/api/v1/` (`.env`의 `PORT`에 맞춤; 기본 5174)
  - **주의**: 관리자 웹(Vercel)과 API(EC2) 호스트가 다르면, Flutter에는 **API가 실제로 떠 있는 URL**을 넣어야 합니다. 위 도메인이 API까지 프록시된다면 도메인 예시를 쓰면 됩니다.

### `/api/v1` 밖에 있는 엔드포인트 (참고)

- **헬스체크**: `GET /health` — 연결·배포 확인용으로 쓸 수 있음 (프리픽스 없음)
- **공지 웹 폴백**: `/notices` — 앱이 전부 `/api/v1`만 쓰면 일반적으로 무관

Flutter 쪽에서는 **앱이 호출하는 경로가 모두 `.../api/v1/...`로 시작하는지** 한 번 확인하면 됩니다.

---

## 2. API 주소가 “진짜로” 무엇인지 확인하기

관리자 웹이 **어떤 호스트로 API를 치는지**는 코드·환경변수만 보고 추측하기보다, 브라우저에서 한 번 확인하는 것이 가장 확실합니다.

1. **관리자 페이지**를 연 상태에서 **F12** → **Network**(네트워크) 탭을 엽니다.
2. 목록 새로고침 등으로 요청이 잡히게 한 뒤, **`/api/v1/`이 포함된 요청** 아무 하나를 클릭합니다.
3. **Request URL** 전체를 봅니다. 여기서 **프로토콜 + 호스트 + `/api/v1`까지**가 Flutter에 넣어야 할 API 베이스와 같아야 합니다. (경로 뒤 `/admin/...` 등은 제외하고, 공통 prefix만 쓰면 됩니다.)

**자주 나오는 형태 예시**

- `https://www.xn--....kr/api/v1/...` (관리자 사이트와 같은 도메인에 API가 붙는 경우)
- `https://api.xn--....kr/api/v1/...` (API 전용 서브도메인)
- `https://<백엔드 별도 도메인>/api/v1/...`

**참고**: 관리자 사이트는 **일등대리** 쪽 운영 URL(예: 관리자 페이지 | 일등대리)을 쓰는 경우가 많습니다. Network에 찍힌 **Request URL 한 줄**이 곧 “앱도 이렇게 붙어야 한다”의 기준입니다.

원하시면 Network에서 복사한 **Request URL 한 줄**을 그대로 공유해 주시면, 그에 맞춘 `--dart-define=API_BASE_URL=...` 명령을 한 줄로 정리해 드릴 수 있습니다.

---

## 3. Flutter에서 할 일: `apiBaseUrl` 맞추기

프로젝트에서 보통 `lib/config/api_config.dart`(또는 동일 역할 파일)에 베이스 URL이 정의되어 있습니다.

- **Release 빌드**: 운영 백엔드 `https://.../api/v1/` (끝 슬래시 규칙은 프로젝트 컨벤션에 맞출 것)
- **Debug 빌드**: 로컬 `http://127.0.0.1:5174/api/v1/` 등 개발 서버 주소

**배포 도메인이 바뀌면** 이 값을 새 URL로 바꾸거나, `--dart-define` / flavor / 환경별 설정으로 **환경마다 다른 `apiBaseUrl`**을 쓰면 됩니다.

### 스토어 없이 배포할 때(추천): 빌드할 때 API를 박아 넣기

Network에서 확인한 베이스 URL을 **`--dart-define=API_BASE_URL=...`**로 Release에 넣으면, 기본값·플레이스홀더(`your-api-host.invalid` 등)로 빠지는 문제를 막을 수 있습니다.

1. **`pubspec.yaml`**에서 **버전 코드**를 한 번 올립니다(예: `+2026041703` → `+2026041704`).
2. 아래처럼 빌드합니다. (URL은 **본인 Network에서 확인한 값**으로 바꿀 것)

```bash
# 예: Play 스토어용 AAB (API가 api.xn--... 서브도메인인 경우)
flutter build appbundle --release --dart-define=API_BASE_URL=https://api.xn--zb0bu7iuubp7hba523s.kr/api/v1/
```

```bash
# 예: APK만 배포할 때
flutter build apk --release --dart-define=API_BASE_URL=https://api.xn--zb0bu7iuubp7hba523s.kr/api/v1/
```

### 이 레포에서 `--dart-define` (구현됨)

`lib/config/api_config.dart`에서 **`API_BASE_URL`**이 비어 있지 않으면 그 값을 쓰고, 비어 있으면 기존처럼 Release/Debug 기본값을 씁니다.

```bash
# 예: 스테이징·다른 운영 도메인으로 APK 빌드
flutter build apk --release --dart-define=API_BASE_URL=https://일등대리관리.kr/api/v1/

# 예: 실기기에서 디버그 실행 시 배포 서버로 붙이기 (도메인)
flutter run --dart-define=API_BASE_URL=https://일등대리관리.kr/api/v1/

# 예: API를 IP로만 쓸 때 (HTTP, 앱 cleartext 설정 필요할 수 있음)
flutter run --dart-define=API_BASE_URL=http://13.125.156.13/api/v1/
```

- URL 끝의 `/`는 있어도 없어도 됩니다 (없으면 자동으로 붙음).
- 인증서 핀닝(`API_CERT_PIN`)을 켠 Release 빌드는 **새 도메인 인증서**에 맞게 핀을 다시 맞추거나, 전환 시 핀을 비워 두세요.

---

## 4. HTTPS vs HTTP

- 운영은 **HTTPS**를 권장합니다. 배포가 HTTPS면 별도 조치 없이 일반적으로 동작합니다.
- Android에서 **HTTP(cleartext)** 만 쓰는 경우에는 `AndroidManifest` / 네트워크 보안 설정 등으로 **cleartext 허용**이 필요할 수 있습니다. (디버그·내부망 한정 권장)

---

## 5. 인증서 핀닝 (Certificate pinning)

Release 빌드에서 `.env` 등으로 **`API_CERT_PIN`**(또는 동일 목적 설정)을 켜 두었다면:

- **도메인 또는 인증서가 바뀌면** 새 체인에 맞게 핀을 **다시 설정**해야 합니다.
- 전환 기간에는 핀을 비우거나 비활성화해 두고, 확정된 도메인·인증서로 다시 핀을 거는 방식도 가능합니다.

핀닝을 쓰지 않으면 이 항목은 해당 없음입니다.

---

## 6. 체크리스트 (Flutter / 배포 담당)

| 항목                                                           | 확인 |
| -------------------------------------------------------------- | ---- |
| 운영 API 베이스 URL이 `https://<도메인>/api/v1/` 형태로 맞는가 |      |
| Release `apiBaseUrl`이 위 URL과 일치하는가                     |      |
| (선택) `GET https://<도메인>/health` 로 서버 가동 확인         |      |
| HTTPS 사용 시 인증서 오류 없음                                 |      |
| HTTP만 쓰는 Android 빌드 시 cleartext 설정                     |      |
| 인증서 핀닝 사용 시 새 도메인/인증서 반영                      |      |

---

## 7. 요약

- **스토어 여부와 무관**하게, **앱의 API 베이스 URL = 실제 배포된 백엔드의 `/api/v1/` prefix**만 맞으면 해당 환경에서 동작 가능합니다.
- 도메인과 prefix를 확정한 뒤 Flutter의 `apiBaseUrl`(및 핀닝·cleartext)만 그에 맞게 조정하면 됩니다.

문의 시 **사용 중인 정확한 API 베이스 URL 한 줄**(프로토콜 + 호스트 + `/api/v1/` 포함 여부)을 백엔드와 공유하면 설정 충돌을 줄일 수 있습니다. (운영: `https://일등대리관리.kr/api/v1/` 또는 `http://13.125.156.13/api/v1/` 중 실제로 응답하는 쪽)
