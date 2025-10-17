# React Native 피트니스 앱

이 폴더는 React Native로 변환된 모바일 앱 코드입니다.

## 📁 폴더 구조

```
react-native/
├── App.tsx                 # 메인 앱 & 네비게이션
├── screens/                # 화면 컴포넌트들
│   ├── Dashboard.tsx       # 홈/대시보드
│   ├── FoodLogger.tsx      # 식단 기록
│   ├── WorkoutLogger.tsx   # 운동 기록
│   ├── Challenge.tsx       # 챌린지
│   ├── Community.tsx       # 커뮤니티
│   └── MyPage.tsx          # 마이페이지
├── components/             # 공통 컴포넌트
│   ├── Card.tsx
│   ├── ProgressBar.tsx
│   ├── Button.tsx
│   └── ...
├── hooks/                  # 커스텀 훅
│   ├── useAsyncStorage.ts
│   └── ...
├── utils/                  # 유틸리티 함수
│   ├── storage.ts
│   └── ...
├── types/                  # TypeScript 타입 정의
│   └── index.ts
└── package.json           # 패키지 의존성

```

## 🚀 사용 방법

1. 로컬 컴퓨터에 이 폴더의 내용을 복사
2. React Native 프로젝트 생성
3. 이 코드들을 프로젝트에 복사
4. 필요한 패키지 설치
5. 앱 실행

자세한 설정 방법은 루트 폴더의 `SETUP_GUIDE.md`를 참고하세요.

## 📦 필요한 패키지

```bash
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install react-native-chart-kit react-native-svg
npm install react-native-vector-icons
npm install date-fns
```

## ⚠️ 주의사항

이 코드는 Figma Make 환경에서 **실행되지 않습니다**.
로컬 컴퓨터에서 React Native 프로젝트를 생성한 후 사용하세요.
