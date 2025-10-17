# React Native 피트니스 앱 - 파일 구조

## 📁 전체 구조

```
react-native/
│
├── 📱 App.tsx                      # 메인 앱 파일 - 네비게이션 설정
│
├── ⚙️ 설정 파일
│   ├── app.json                   # Expo 앱 설정
│   ├── babel.config.js            # Babel 설정
│   ├── tsconfig.json              # TypeScript 설정
│   └── package.json               # 의존성 패키지
│
├── 📄 문서
│   ├── README.md                  # 프로젝트 개요
│   ├── INSTALL.md                 # 설치 가이드
│   └── FILE_STRUCTURE.md          # 이 파일
│
├── 📺 screens/                    # 화면 컴포넌트
│   ├── Dashboard.tsx              # 홈 대시보드
│   ├── FoodLogger.tsx             # 식단 기록
│   ├── WorkoutLogger.tsx          # 운동 기록
│   ├── Challenge.tsx              # 챌린지 & 랭킹
│   ├── Community.tsx              # 커뮤니티
│   └── MyPage.tsx                 # 마이페이지
│
├── 🧩 components/                 # 공통 컴포넌트
│   ├── Card.tsx                   # 카드 컴포넌트
│   ├── Button.tsx                 # 버튼 컴포넌트
│   ├── ProgressBar.tsx            # 진행률 바
│   └── Badge.tsx                  # 뱃지
│
├── 🪝 hooks/                      # 커스텀 훅
│   └── useAsyncStorage.ts         # AsyncStorage 훅
│
├── 🛠️ utils/                      # 유틸리티 함수
│   └── storage.ts                 # 저장소 헬퍼 함수
│
└── 📝 types/                      # TypeScript 타입 정의
    └── index.ts                   # 전체 타입 정의
```

---

## 📱 App.tsx

**역할**: 메인 앱 컴포넌트 및 네비게이션 설정

**주요 기능**:
- Bottom Tab Navigator 설정
- 6개 탭 화면 연결
- 아이콘 및 스타일 설정

**의존성**:
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `react-native-vector-icons`

---

## 📺 Screens (화면 컴포넌트)

### Dashboard.tsx
**역할**: 홈 대시보드 화면

**주요 기능**:
- 운동 진행도에 따른 캐릭터 상태 표시
- 일일 영양소 통계 (칼로리, 단백질, 탄수화물, 지방)
- InBody 데이터 표시
- 주간 운동 시간 차트
- 달성 배지 표시

**의존성**:
- `react-native-chart-kit` (차트)
- `useAsyncStorage` (데이터 저장)

---

### FoodLogger.tsx
**역할**: 식단 기록 및 관리

**주요 기능**:
- 음식 검색 및 추가
- 오늘 섭취한 영양소 추적
- 영양소 분포 원형 차트
- 목표 대비 진행률 표시
- 3개 탭: 추적 / 추천 식단 / AI 레시피

**데이터 구조**:
```typescript
FoodEntry {
  id: string
  food: Food
  quantity: number
  time: string
}
```

---

### WorkoutLogger.tsx
**역할**: 운동 기록 및 추천

**주요 기능**:
- 운동 추가 및 삭제
- 오늘의 운동 통계 (시간, 칼로리, 종목)
- 부위별 운동 추천 (가슴, 등, 하체, 유산소)
- 유튜브 자세 설명 링크
- 난이도별 분류 (초급, 중급, 고급)

**데이터 구조**:
```typescript
WorkoutEntry {
  id: string
  exercise: Exercise
  duration: number
  intensity?: 'low' | 'medium' | 'high'
  time: string
}
```

---

### Challenge.tsx
**역할**: 챌린지 및 랭킹 시스템

**주요 기능**:
- 주간 랭킹 (운동시간 / 칼로리 / 걸음수)
- 진행 중인 챌린지 목록
- 챌린지 진행률 표시
- 참여 인원 및 보상 정보

**랭킹 카테고리**:
- 운동 시간 (분)
- 칼로리 소모 (kcal)
- 걸음수 (걸음)

---

### Community.tsx
**역할**: 커뮤니티 피드

**주요 기능**:
- 카테고리별 게시물 (핫 / 운동 / 식단 / 다이어트)
- 좋아요 및 댓글 기능
- 해시태그 표시
- 작성자 레벨 표시
- 게시물 검색

**게시물 카테고리**:
- `workout`: 운동 관련
- `diet`: 식단 관련
- `weight-loss`: 다이어트 관련

---

### MyPage.tsx
**역할**: 사용자 설정 및 프로필

**주요 기능**:
- 프로필 정보 표시
- 운동 통계 (횟수, 연속일수, 배지)
- 계정 설정 (프로필, 이메일, 비밀번호)
- 앱 설정 (알림, 다크모드, 목표)
- 데이터 관리 (내보내기, 가져오기, InBody 연동)
- 지원 (도움말, 문의, 앱 정보)
- 로그아웃 / 계정 삭제

---

## 🧩 Components (공통 컴포넌트)

### Card.tsx
**역할**: 카드 레이아웃 컴포넌트

**제공 컴포넌트**:
- `Card`: 카드 컨테이너
- `CardHeader`: 카드 헤더
- `CardTitle`: 카드 제목
- `CardContent`: 카드 내용

**사용 예시**:
```typescript
<Card>
  <CardHeader>
    <CardTitle>제목</CardTitle>
  </CardHeader>
  <CardContent>
    내용
  </CardContent>
</Card>
```

---

### Button.tsx
**역할**: 버튼 컴포넌트

**Variants**:
- `default`: 기본 파란색
- `outline`: 테두리만
- `ghost`: 배경 투명
- `destructive`: 빨간색 (삭제 등)

**Sizes**:
- `sm`: 작은 크기
- `default`: 기본 크기
- `lg`: 큰 크기

**사용 예시**:
```typescript
<Button 
  variant="default" 
  size="lg"
  onPress={handlePress}
>
  클릭
</Button>
```

---

### ProgressBar.tsx
**역할**: 진행률 표시 바

**Props**:
- `value`: 현재 값
- `max`: 최대 값
- `color`: 바 색상
- `backgroundColor`: 배경 색상
- `height`: 높이

**사용 예시**:
```typescript
<ProgressBar 
  value={75} 
  max={100}
  color="#6366f1"
  height={8}
/>
```

---

### Badge.tsx
**역할**: 뱃지/라벨 컴포넌트

**Variants**:
- `default`: 파란색
- `secondary`: 회색
- `destructive`: 빨간색
- `outline`: 테두리만

**사용 예시**:
```typescript
<Badge variant="secondary">
  골드
</Badge>
```

---

## 🪝 Hooks (커스텀 훅)

### useAsyncStorage.ts

**역할**: AsyncStorage를 useState처럼 사용

**함수**:
1. `useAsyncStorage<T>(key, initialValue)`
   - localStorage의 React Native 버전
   - 자동 저장 및 로드
   - 반환값: `[value, setValue, loading, error]`

2. `useMultiAsyncStorage(keys)`
   - 여러 값을 한번에 로드
   - 반환값: `[values, loading, error]`

**사용 예시**:
```typescript
const [foodEntries, setFoodEntries, loading] = useAsyncStorage<FoodEntry[]>(
  'foodEntries',
  []
);

// 값 설정
await setFoodEntries([...foodEntries, newEntry]);
```

---

## 🛠️ Utils (유틸리티)

### storage.ts

**역할**: AsyncStorage 헬퍼 함수

**제공 함수**:
- `saveData<T>(key, data)`: 데이터 저장
- `loadData<T>(key, defaultValue)`: 데이터 로드
- `removeData(key)`: 데이터 삭제
- `clearAllData()`: 모든 데이터 삭제
- `getAllKeys()`: 모든 키 가져오기

**Storage Keys**:
```typescript
StorageKeys = {
  FOOD_ENTRIES: 'foodEntries',
  WORKOUT_ENTRIES: 'workoutEntries',
  USER_INFO: 'userInfo',
  DAILY_GOALS: 'dailyGoals',
  CHALLENGES: 'challenges',
  FAVORITES: 'favorites',
}
```

---

## 📝 Types (타입 정의)

### index.ts

**주요 타입**:

1. **Food**: 음식 정보
2. **FoodEntry**: 식단 기록
3. **Exercise**: 운동 정보
4. **WorkoutEntry**: 운동 기록
5. **RecommendedExercise**: 추천 운동
6. **RankingUser**: 랭킹 사용자
7. **Challenge**: 챌린지
8. **Post**: 커뮤니티 게시물
9. **UserInfo**: 사용자 정보
10. **DailyGoals**: 일일 목표
11. **CurrentNutrition**: 현재 영양소
12. **InBodyData**: InBody 데이터

---

## ⚙️ 설정 파일

### app.json
- Expo 앱 메타데이터
- iOS/Android 설정
- 권한 설정
- 플러그인 설정

### babel.config.js
- Babel 트랜스파일러 설정
- Reanimated 플러그인

### tsconfig.json
- TypeScript 컴파일러 설정
- 모듈 해석 규칙

### package.json
- 필요한 npm 패키지
- 스크립트 명령어

---

## 🎨 디자인 시스템

### 색상
```typescript
primary: '#6366f1'      // 인디고
secondary: '#f3f4f6'    // 회색
destructive: '#ef4444'  // 빨강
success: '#10b981'      // 초록
warning: '#f59e0b'      // 노랑
info: '#3b82f6'         // 파랑
```

### 간격
```typescript
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 24px
2xl: 32px
```

### 폰트 크기
```typescript
xs: 12px
sm: 14px
base: 16px
lg: 18px
xl: 20px
2xl: 24px
```

---

## 📊 데이터 흐름

```
사용자 입력
    ↓
화면 컴포넌트
    ↓
useAsyncStorage 훅
    ↓
storage.ts (헬퍼 함수)
    ↓
AsyncStorage (기기 저장소)
```

---

## 🔄 상태 관리

현재는 각 화면에서 로컬 상태 + AsyncStorage 사용

**향후 확장 시**:
- Redux / Zustand: 전역 상태 관리
- React Query: 서버 상태 관리
- Context API: 테마/언어 등 공통 상태

---

## 📦 의존성 패키지

### 네비게이션
- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `react-native-screens`
- `react-native-safe-area-context`

### UI
- `react-native-vector-icons`
- `react-native-chart-kit`
- `react-native-svg`

### 데이터
- `@react-native-async-storage/async-storage`
- `date-fns`

### 제스처
- `react-native-gesture-handler`
- `react-native-reanimated`

---

## 🚀 다음 단계

1. **API 연동**: 백엔드 서버 연결
2. **인증**: 로그인/회원가입
3. **푸시 알림**: 운동 리마인더
4. **헬스킷 연동**: iOS HealthKit, Android Health Connect
5. **소셜 공유**: SNS 연동
6. **다국어 지원**: i18n
7. **다크 모드**: 테마 시스템

---

이 구조는 확장 가능하고 유지보수가 쉬운 방식으로 설계되었습니다!
