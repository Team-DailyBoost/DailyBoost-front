# React Native 설정 가이드

## ⚡ 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. Expo CLI 설치 (필요한 경우)

```bash
npm install -g expo-cli
```

### 3. 개발 서버 실행

```bash
npm start
```

또는

```bash
npx expo start
```

### 4. 앱 실행

개발 서버가 시작되면:
- **QR 코드 스캔**: Expo Go 앱에서 QR 코드를 스캔
- **키보드 명령어**:
  - `i` - iOS 시뮬레이터에서 열기
  - `a` - Android 에뮬레이터에서 열기
  - `w` - 웹 브라우저에서 열기

## 📱 앱 설치 방법

### iOS (시뮬레이터)

1. Xcode 설치 필요
2. `npm run ios` 실행
3. 또는 Expo Go 설치 후 QR 코드 스캔

### Android (에뮬레이터)

1. Android Studio 설치 필요
2. Android 에뮬레이터 설정
3. `npm run android` 실행
4. 또는 Expo Go 설치 후 QR 코드 스캔

### Expo Go (실제 기기)

1. **iOS**: App Store에서 "Expo Go" 검색 및 설치
2. **Android**: Play Store에서 "Expo Go" 검색 및 설치
3. 개발 서버 실행 후 QR 코드 스캔

## 🛠️ 필수 요구사항

### 시스템 요구사항

- **Node.js**: v16 이상
- **npm** 또는 **yarn**
- **Xcode** (iOS 개발용, macOS만)
- **Android Studio** (Android 개발용)

### Expo Go 요구사항

- WiFi 또는 모바일 데이터 연결
- 개발 서버와 같은 네트워크(로컬 네트워크)

## 🔧 문제 해결

### Metro Bundler 오류

```bash
# 캐시 클리어
npx expo start -c
```

### 의존성 문제

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### React Native 버전 오류

```bash
# 패키지 버전 확인
npm list react-native
npm list expo
```

## 📂 프로젝트 구조

```
.
├── App.tsx                     # 메인 앱
├── app.json                    # Expo 설정
├── babel.config.js             # Babel 설정
├── package.json                # 의존성
├── tsconfig.json               # TypeScript 설정
└── src/
    └── react-native/
        ├── screens/            # 화면 컴포넌트
        ├── components/          # 재사용 컴포넌트
        ├── hooks/               # 커스텀 훅
        ├── types/               # TypeScript 타입
        └── utils/               # 유틸리티
```

## 🚀 빌드

### 로컬 빌드

```bash
# Android APK
eas build --platform android

# iOS
eas build --platform ios
```

### EAS 서비스

[Expo Application Services](https://expo.dev/) 사용:

```bash
npm install -g eas-cli
eas login
eas build --platform android
```

## 📝 참고

- 상세 설정: [Expo 공식 문서](https://docs.expo.dev/)
- React Navigation: [공식 문서](https://reactnavigation.org/)
- React Native: [공식 문서](https://reactnative.dev/)
