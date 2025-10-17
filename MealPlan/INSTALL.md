# React Native 피트니스 앱 설치 가이드

이 폴더의 코드를 사용하여 React Native 모바일 앱을 만드는 방법입니다.

## 🚀 빠른 시작 (Expo 사용)

### 1단계: 사전 준비
```bash
# Node.js 18 이상 설치 확인
node --version

# Expo CLI 설치 (옵션)
npm install -g expo-cli
```

### 2단계: 새 Expo 프로젝트 생성
```bash
# 새 프로젝트 생성
npx create-expo-app@latest my-fitness-app

# 프로젝트 디렉토리로 이동
cd my-fitness-app
```

### 3단계: 이 폴더의 파일들을 프로젝트로 복사
```bash
# /react-native/ 폴더의 모든 파일을 복사
# - screens/
# - components/
# - hooks/
# - utils/
# - types/
# - App.tsx
# - package.json (의존성만 복사)
```

### 4단계: 필요한 패키지 설치
```bash
# 네비게이션
npm install @react-navigation/native @react-navigation/bottom-tabs

# Expo 필수 패키지
npx expo install react-native-screens react-native-safe-area-context

# 제스처 및 애니메이션
npx expo install react-native-gesture-handler react-native-reanimated

# 데이터 저장소
npm install @react-native-async-storage/async-storage

# 차트
npm install react-native-chart-kit react-native-svg

# 아이콘
npm install react-native-vector-icons

# 날짜 처리
npm install date-fns
```

### 5단계: 아이콘 폰트 설정

#### react-native-vector-icons 설정

`App.tsx`가 있는 최상위 폴더에 `react-native.config.js` 파일 생성:

```javascript
module.exports = {
  dependencies: {
    'react-native-vector-icons': {
      platforms: {
        ios: null,
      },
    },
  },
  assets: ['./node_modules/react-native-vector-icons/Fonts'],
};
```

Android의 경우 `android/app/build.gradle`에 추가:
```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

**Expo를 사용하는 경우** `@expo/vector-icons` 사용 권장:
```bash
npx expo install @expo/vector-icons
```

그리고 코드에서 import 변경:
```typescript
// 변경 전
import Icon from 'react-native-vector-icons/Feather';

// 변경 후
import { Feather as Icon } from '@expo/vector-icons';
```

### 6단계: 앱 실행
```bash
# 개발 서버 시작
npx expo start

# 그 다음:
# - 'i' 키: iOS 시뮬레이터
# - 'a' 키: Android 에뮬레이터
# - Expo Go 앱으로 QR 코드 스캔 (실제 기기)
```

---

## 📱 실제 기기에서 테스트

### iOS & Android
1. 앱스토어/플레이스토어에서 **Expo Go** 앱 설치
2. 개발 서버 실행: `npx expo start`
3. Expo Go 앱으로 QR 코드 스캔
4. 앱이 자동으로 로드됨

---

## 🏗️ 프로덕션 빌드

### EAS Build 사용 (Expo 권장)

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 빌드 설정
eas build:configure

# Android APK 빌드 (테스트용)
eas build --platform android --profile preview

# iOS 빌드 (Apple Developer 계정 필요)
eas build --platform ios --profile preview

# 프로덕션 빌드 (앱스토어 제출용)
eas build --platform all --profile production
```

---

## 🔧 문제 해결

### 캐시 문제
```bash
# Metro bundler 캐시 클리어
npx expo start -c
```

### 패키지 설치 문제
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

### iOS 시뮬레이터 문제
```bash
# 시뮬레이터 재시작
killall Simulator
npx expo start --ios
```

### Android 에뮬레이터 문제
```bash
# Android 에뮬레이터 재시작
adb kill-server
adb start-server
npx expo start --android
```

---

## 📂 프로젝트 구조

```
my-fitness-app/
├── App.tsx                 # 메인 앱 & 네비게이션
├── app.json               # Expo 설정
├── babel.config.js        # Babel 설정
├── package.json           # 의존성
├── tsconfig.json          # TypeScript 설정
├── screens/               # 화면 컴포넌트
│   ├── Dashboard.tsx
│   ├── FoodLogger.tsx
│   ├── WorkoutLogger.tsx
│   ├── Challenge.tsx
│   ├── Community.tsx
│   └── MyPage.tsx
├── components/            # 공통 컴포넌트
│   ├── Card.tsx
│   ├── Button.tsx
│   ├── ProgressBar.tsx
│   └── Badge.tsx
├── hooks/                 # 커스텀 훅
│   └── useAsyncStorage.ts
├── utils/                 # 유틸리티 함수
│   └── storage.ts
└── types/                 # TypeScript 타입
    └── index.ts
```

---

## 🎨 커스터마이징

### 색상 변경
각 컴포넌트의 `styles` 섹션에서 색상을 변경할 수 있습니다.

예: `components/Button.tsx`
```typescript
default: {
  backgroundColor: '#6366f1', // 원하는 색상으로 변경
},
```

### 폰트 변경
Expo에서 커스텀 폰트 사용:

```bash
npx expo install expo-font
```

```typescript
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'CustomFont-Regular': require('./assets/fonts/CustomFont-Regular.ttf'),
  });

  if (!fontsLoaded) return null;
  
  // ...
}
```

---

## 📚 추가 리소스

- [Expo 공식 문서](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native 공식 문서](https://reactnative.dev/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

---

## ⚠️ 중요 사항

1. **웹 앱과 동시 실행 불가**: 이 React Native 코드는 Figma Make 환경에서 실행되지 않습니다.

2. **로컬 환경 필요**: 반드시 로컬 컴퓨터에서 React Native 프로젝트를 생성해야 합니다.

3. **Expo vs React Native CLI**: 초보자는 Expo 사용을 권장합니다.

4. **API 키**: 실제 서비스 연동 시 환경 변수 사용:
   ```bash
   # .env 파일 생성
   API_KEY=your_api_key_here
   ```

---

## ✅ 체크리스트

설치가 완료되었는지 확인:

- [ ] Node.js 18 이상 설치
- [ ] Expo 프로젝트 생성
- [ ] 모든 파일 복사 완료
- [ ] 필요한 패키지 설치 완료
- [ ] 개발 서버 실행 성공
- [ ] 시뮬레이터/에뮬레이터에서 앱 실행 성공
- [ ] 6개 탭 모두 정상 작동 확인

---

문제가 발생하면 루트 폴더의 `SETUP_GUIDE.md`와 `REACT_NATIVE_MIGRATION_GUIDE.md`를 참고하세요!
