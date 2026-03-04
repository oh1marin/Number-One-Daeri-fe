# macOS iOS 빌드 머신 운영 가이드

> **원칙**: 개발은 Windows. macOS는 iOS 빌드/배포 전용.

---

## 역할 분리

| 머신        | 역할                                                              |
| ----------- | ----------------------------------------------------------------- |
| **Windows** | BE 개발/배포, Admin Web, Flutter 개발 (Android), 릴리즈 태그 생성 |
| **macOS**   | iOS 빌드(archive), 서명(Signing), TestFlight/App Store 업로드     |

---

## 저장소 구성

```
mobile-repo (Flutter 앱만) ← macOS에 이것만 클론
  apps/
    customer_app/
    driver_app/
  packages/
    core/
    ui/
```

> 모노레포 구성이더라도 macOS에는 `mobile-repo` 또는 `apps/` 부분만 있으면 됨.

---

## 브랜치 & 릴리즈 흐름

```
[Windows] dev → release/ios-x.y.z 생성 + 태그
     ↓
[macOS]  git checkout release/ios-x.y.z
         → 빌드 → TestFlight 업로드
     ↓
[Windows] main 머지 + vX.Y.Z 태그 확정
```

> iOS 릴리즈는 반드시 `release/` 브랜치 기준으로만 진행.

---

## macOS 초기 세팅

```bash
# 필수 설치
brew install cocoapods
# Xcode: App Store에서 설치
xcode-select --install

# Flutter (Windows와 버전 통일)
flutter doctor
```

**계정 설정**

- Xcode에 Apple ID 로그인
- Apple Developer Program 등록
- Signing 인증서 / Provisioning Profile 설정

---

## 빌드 머신 작업 순서

```bash
# 1. 코드 최신화
git checkout release/ios-x.y.z && git pull

# 2. Flutter 의존성
flutter clean && flutter pub get

# 3. iOS 의존성
cd ios && pod install && cd ..

# 4. 빌드
flutter build ios --release \
  --dart-define=API_BASE_URL=https://api.ride.kr \
  --dart-define=WS_BASE_URL=wss://ws.ride.kr \
  --dart-define=MAP_API_KEY=xxx

# 5. 업로드 (fastlane 권장)
fastlane beta
```

---

## 빌드 실패 시 초기화

```bash
flutter clean
cd ios && pod deintegrate && pod install && cd ..
# Xcode → Product → Clean Build Folder (DerivedData 삭제)
```

---

## 주의사항

| 항목                | 규칙                                                          |
| ------------------- | ------------------------------------------------------------- |
| 줄바꿈              | `.gitattributes`로 LF 통일 (CRLF 혼용 방지)                   |
| 파일명 대소문자     | Dart import 경로 대소문자 일치 강제                           |
| macOS에서 직접 수정 | Info.plist, Signing 등 변경 시 **즉시 커밋 → Windows 동기화** |
| 환경변수            | API URL 하드코딩 금지, `--dart-define` 사용                   |

---

## 업로드 방식 선택

| 방식        | 내용                                      | 권장                 |
| ----------- | ----------------------------------------- | -------------------- |
| A) 직접     | 원격 접속(AnyDesk 등) → Xcode Archive     | 빠른 시작            |
| B) fastlane | `fastlane beta` 한 줄로 TestFlight 업로드 | **추천**             |
| C) CI       | GitHub Actions macOS runner               | 비용 발생, 추후 도입 |
