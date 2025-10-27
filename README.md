
# Workout Meal Plan App (React Native)

This is a React Native fitness and meal planning app built with Expo.

Original design: https://www.figma.com/design/zTnYv3lBGPa2lrKR6WDWNt/Workout-Meal-Plan-App

## 📱 Features

- 🏠 **대시보드**: 오늘의 활동 요약 및 통계
- 🍎 **식단 기록**: 칼로리 및 영양소 추적
- 💪 **운동 기록**: 운동 시간 및 활동 기록
- 🏆 **챌린지**: 목표 설정 및 성취 관리
- 👥 **커뮤니티**: 소셜 피트니스 기능
- 👤 **마이페이지**: 프로필 및 설정

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
# Expo 개발 서버 시작
npm start

# 또는 특정 플랫폼으로 실행
npm run ios      # iOS 시뮬레이터
npm run android  # Android 에뮬레이터
npm run web      # 웹 브라우저
```

### 3. Expo Go 앱 설치

- **iOS**: [App Store에서 Expo Go 다운로드](https://apps.apple.com/app/expo-go/id982107779)
- **Android**: [Google Play에서 Expo Go 다운로드](https://play.google.com/store/apps/details?id=host.exp.exponent)

개발 서버 실행 후 QR 코드를 스캔하여 앱을 실행하세요.

## 📦 주요 기술 스택

- **React Native**: 크로스 플랫폼 모바일 앱 개발
- **Expo**: React Native 개발 플랫폼
- **React Navigation**: 네비게이션
- **React Native Chart Kit**: 차트 및 그래프
- **AsyncStorage**: 로컬 데이터 저장
- **TypeScript**: 타입 안전성

## 📁 프로젝트 구조

```
.
├── App.tsx                          # 메인 앱 (네비게이션)
├── app.json                         # Expo 설정
├── babel.config.js                  # Babel 설정
├── package.json                     # 의존성 관리
├── tsconfig.json                    # TypeScript 설정
├── src/
│   ├── react-native/
│   │   ├── screens/                 # 화면 컴포넌트
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FoodLogger.tsx
│   │   │   ├── WorkoutLogger.tsx
│   │   │   ├── Challenge.tsx
│   │   │   ├── Community.tsx
│   │   │   └── MyPage.tsx
│   │   ├── components/              # 재사용 가능한 컴포넌트
│   │   ├── hooks/                   # 커스텀 훅
│   │   ├── types/                   # TypeScript 타입 정의
│   │   └── utils/                     # 유틸리티 함수
│   └── components/                   # 웹 컴포넌트 (레거시)
```

## 🛠️ 개발

### 개발 모드 실행

```bash
npm start
```

개발 서버가 시작되면 다음 명령어를 사용할 수 있습니다:
- `i` - iOS 시뮬레이터 열기
- `a` - Android 에뮬레이터 열기
- `w` - 웹 브라우저 열기
- `r` - 리로드
- `m` - 메뉴 열기

### 빌드

```bash
# Android APK 빌드
eas build --platform android

# iOS 빌드
eas build --platform ios
```

## 📱 앱 화면

### 홈 (대시보드)
- 오늘의 활동 요약
- InBody 데이터 통합
- 운동 진행 상태
- 영양소 현황
- 주간 통계

### 식단 기록
- 칼로리 추적
- 영양소 분석
- 식단 기록 및 관리
- AI 레시피 추천

### 운동 기록
- 운동 시간 추적
- 운동 유형 선택
- 활동 로그
- 운동 통계

## 🤝 기여하기

이 프로젝트에 기여하려면:
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 라이선스

MIT License

## 👨‍💻 개발자

Workout Meal Plan App Team
  