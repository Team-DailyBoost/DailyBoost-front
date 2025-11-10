# 프론트엔드 전체 기능 설명서

## 📱 앱 개요

**DailyBoost**는 운동과 식단 관리를 통합한 헬스케어 모바일 애플리케이션입니다.
React Native (Expo)로 개발되었으며, Spring Boot 백엔드와 연동됩니다.

---

## 🏗️ 프로젝트 구조

```
front/
├── src/
│   ├── api/                    # API 클라이언트 (백엔드 통신)
│   │   ├── client.ts          # Axios 인스턴스 및 인터셉터
│   │   ├── users.ts           # 사용자 API
│   │   ├── foods.ts           # 식단 API
│   │   ├── posts.ts           # 게시글 API
│   │   ├── comments.ts        # 댓글 API
│   │   ├── calendars.ts       # 캘린더 API
│   │   ├── events.ts          # 이벤트 API
│   │   ├── exercises.ts       # 운동 API
│   │   ├── gemini.ts          # AI 추천 API
│   │   ├── images.ts          # 이미지 업로드 API
│   │   └── email.ts           # 이메일 API
│   ├── react-native/
│   │   ├── screens/           # 화면 컴포넌트
│   │   │   ├── Auth/         # 인증 화면
│   │   │   ├── Dashboard.tsx # 홈 화면
│   │   │   ├── FoodLogger.tsx # 식단 관리
│   │   │   ├── WorkoutLogger.tsx # 운동 관리
│   │   │   ├── Community.tsx # 커뮤니티
│   │   │   ├── Challenge.tsx # 챌린지
│   │   │   └── MyPage.tsx    # 마이페이지
│   │   └── components/        # 공통 컴포넌트
│   ├── screens/
│   │   └── LoginWebView.tsx  # OAuth2 로그인 WebView
│   ├── storage/
│   │   └── session.ts        # 세션 관리
│   └── config/
│       └── api.ts            # API 설정
└── App.tsx                    # 앱 진입점
```

---

## 🔐 1. 인증 시스템

### 1.1 OAuth2 소셜 로그인
- **지원 플랫폼**: 네이버, 카카오
- **구현 위치**: `src/screens/LoginWebView.tsx`
- **주요 기능**:
  - WebView를 통한 OAuth2 로그인 플로우
  - 로그인 성공 후 쿠키/토큰 자동 추출
  - 콜백 URL 감지 시 WebView 자동 닫기 (하얀 화면 방지)
  - JWT 토큰 및 세션 쿠키 저장

### 1.2 인증 상태 관리
- **저장소**: AsyncStorage
- **저장 항목**:
  - `@accessToken`: JWT Access Token
  - `@refreshToken`: JWT Refresh Token
  - `@sessionCookie`: 세션 쿠키 (JSESSIONID)
  - `currentUser`: 현재 사용자 정보

### 1.3 자동 인증 처리
- **API 요청 시**: JWT 토큰 우선 사용, 없으면 세션 쿠키 사용
- **401/403 응답 시**: 자동 로그아웃 및 로그인 화면 이동
- **토큰 갱신**: 응답 헤더에서 자동 추출 및 저장

---

## 🏠 2. 홈 화면 (Dashboard)

### 2.1 주요 기능
- **위치**: `src/react-native/screens/Dashboard.tsx`
- **기능**:
  1. **오늘의 날짜 및 요일 표시**
  2. **일일 목표 및 진행률**
     - 칼로리, 단백질, 탄수화물, 지방
     - 운동 시간
  3. **캐릭터 상태 표시**
     - 운동 진행률에 따른 캐릭터 이모지 및 메시지
     - 0-100% 진행률에 따라 5단계 상태 표시
  4. **영양소 진행률 차트**
     - Bar Chart로 칼로리, 단백질, 탄수화물, 지방 표시
  5. **주간 운동 시간 추이**
     - Line Chart로 일주일간 운동 시간 그래프
  6. **AI 운동 추천**
     - Gemini AI를 통한 맞춤형 운동 추천
     - 컨디션 선택 (좋음/보통/피곤함)
     - 운동 시간 설정
  7. **AI 식단 추천**
     - 아침/점심/저녁 메뉴 추천
     - 칼로리 및 영양소 정보 표시

### 2.2 데이터 시각화
- **라이브러리**: `react-native-chart-kit`
- **차트 타입**:
  - Bar Chart: 영양소 진행률
  - Line Chart: 주간 운동 시간 추이

---

## 🍽️ 3. 식단 관리 (FoodLogger)

### 3.1 주요 기능
- **위치**: `src/react-native/screens/FoodLogger.tsx`
- **기능**:
  1. **오늘의 식단 기록**
     - 아침/점심/저녁/간식별 식단 추가
     - 음식 검색 및 추가
     - 칼로리 및 영양소 자동 계산
  2. **일일 영양소 통계**
     - 총 칼로리, 단백질, 탄수화물, 지방
     - 목표 대비 진행률 (ProgressBar)
  3. **AI 식단 추천**
     - Gemini AI를 통한 맞춤형 식단 추천
     - 아침/점심/저녁별 추천
     - 레시피 추천
  4. **레시피 검색**
     - 레시피 목록 조회
     - 재료, 조리 시간, 난이도 표시
  5. **주간 식단 조회**
     - 일주일간 식단 기록 조회
  6. **식단 초기화**
     - 오늘의 식단 기록 초기화

### 3.2 API 연동
- `getTodayFoods()`: 오늘의 식단 조회
- `getWeeklyFoods()`: 주간 식단 조회
- `getFoodRecommendations()`: 하루 음식 추천
- `getRecipeRecommendation()`: 레시피 추천
- `searchFoods()`: 음식 검색
- `registerFood()`: 식단 기록에 추가
- `unregisterFood()`: 식단 기록에서 제거
- `resetFood()`: 일일 식단 초기화

---

## 💪 4. 운동 관리 (WorkoutLogger)

### 4.1 주요 기능
- **위치**: `src/react-native/screens/WorkoutLogger.tsx`
- **기능**:
  1. **오늘의 운동 기록**
     - 운동 종목, 세트, 횟수, 무게 기록
     - 운동 시간 타이머
     - 메모 작성
  2. **AI 운동 추천**
     - Gemini AI를 통한 맞춤형 운동 추천
     - 컨디션 선택 (좋음/보통/피곤함)
     - 운동 시간 설정
     - 난이도 선택 (초급/중급/고급)
  3. **부위별 운동 선택**
     - 가슴, 등, 어깨, 하체, 이두, 삼두, 유산소
  4. **운동 데이터베이스**
     - 각 운동별 설명, 주의사항, 칼로리 정보
  5. **운동 타이머**
     - 운동 시간 측정
     - 목표 시간 설정
  6. **운동 등록**
     - 추천받은 운동을 오늘의 운동에 추가

### 4.2 API 연동
- `getExerciseRecommendation()`: 운동 추천
- `registerExercise()`: 운동 등록

### 4.3 운동 데이터베이스
- **포함 운동**:
  - 가슴: 푸시업, 벤치프레스, 딥스
  - 등: 풀업, 랫 풀다운
  - 어깨: 숄더 프레스, 래터럴 레이즈
  - 하체: 스쿼트, 런지
  - 유산소: 러닝, HIIT

---

## 🏆 5. 챌린지 (Challenge)

### 5.1 주요 기능
- **위치**: `src/react-native/screens/Challenge.tsx`
- **기능**:
  1. **진행 중인 챌린지**
     - 챌린지 목록 조회
     - 진행률 표시
     - 보상 정보
  2. **챌린지 참여**
     - 챌린지 가입
     - 일일 목표 달성 체크
  3. **챌린지 진행률**
     - 개인 진행률 표시
     - 리더보드 (랭킹)

---

## 👥 6. 커뮤니티 (Community)

### 6.1 주요 기능
- **위치**: `src/react-native/screens/Community.tsx`
- **기능**:
  1. **게시글 목록**
     - 카테고리별 게시글 조회 (운동/식단/다이어트)
     - 검색 기능
     - 좋아요, 댓글 수 표시
  2. **게시글 작성**
     - 제목, 내용 입력
     - 카테고리 선택
     - 이미지 첨부
  3. **게시글 상세**
     - 게시글 내용 조회
     - 댓글 목록
     - 좋아요/싫어요 기능
  4. **댓글 기능**
     - 댓글 작성
     - 댓글 수정
     - 댓글 삭제
     - 댓글 좋아요/싫어요
  5. **사용자 프로필**
     - 사용자 프로필 조회
     - 팔로우/언팔로우
  6. **컴피티션 (대회)**
     - 대회 참가
     - 이미지 업로드 (최소 3장)
     - 투표 기능

### 6.2 API 연동
- `getPosts()`: 게시글 목록 조회
- `getPost()`: 게시글 상세 조회
- `searchPosts()`: 게시글 검색
- `createPost()`: 게시글 생성
- `updatePost()`: 게시글 수정
- `deletePost()`: 게시글 삭제
- `likePost()`: 게시글 좋아요
- `unlikePost()`: 게시글 좋아요 취소
- `getComments()`: 댓글 목록 조회
- `createComment()`: 댓글 생성
- `updateComment()`: 댓글 수정
- `deleteComment()`: 댓글 삭제
- `likeComment()`: 댓글 좋아요
- `unlikeComment()`: 댓글 좋아요 취소

---

## 👤 7. 마이페이지 (MyPage)

### 7.1 주요 기능
- **위치**: `src/react-native/screens/MyPage.tsx`
- **기능**:
  1. **프로필 정보**
     - 프로필 이미지 업로드
     - 이름, 나이, 성별 표시
     - 키, 몸무게, 목표 표시
  2. **프로필 수정**
     - 이름, 나이, 성별 수정
     - 키, 몸무게, 목표 수정
     - 헬스 정보 등록/수정
  3. **사용자 등급**
     - 티어 시스템 (브론즈/실버/골드/플래티넘/다이아)
     - 경험치 (EXP) 표시
  4. **팔로우/팔로워**
     - 팔로워 수
     - 팔로잉 수
  5. **설정**
     - 알림 설정
     - 다크 모드 (준비 중)
  6. **계정 관리**
     - 계정 삭제
     - 로그아웃
     - 계정 복구

### 7.2 API 연동
- `getUserProfile()`: 사용자 프로필 조회
- `updateUserInfo()`: 사용자 정보 수정
- `initUserInfo()`: 헬스 정보 등록
- `unregisterUser()`: 계정 삭제
- `recoverUserAccount()`: 계정 복구
- `uploadProfileImage()`: 프로필 이미지 업로드
- `sendHtmlEmail()`: 이메일 전송 (계정 복구 코드)

---

## 📅 8. 캘린더 및 이벤트 (준비 중)

### 8.1 주요 기능
- **캘린더 관리**
  - 캘린더 생성
  - 캘린더 수정
  - 캘린더 삭제
  - 캘린더에 사용자 초대
- **이벤트 관리**
  - 이벤트 생성
  - 이벤트 수정
  - 이벤트 삭제
  - 날짜 범위별 이벤트 조회

### 8.2 API 연동
- `getCalendars()`: 캘린더 목록 조회
- `getCalendar()`: 캘린더 상세 조회
- `createCalendar()`: 캘린더 생성
- `updateCalendar()`: 캘린더 수정
- `deleteCalendar()`: 캘린더 삭제
- `inviteUsersToCalendar()`: 캘린더에 사용자 초대
- `getEvents()`: 이벤트 목록 조회
- `getEvent()`: 이벤트 상세 조회
- `createEvent()`: 이벤트 생성
- `updateEvent()`: 이벤트 수정
- `deleteEvent()`: 이벤트 삭제

---

## 🤖 9. AI 추천 기능

### 9.1 Gemini AI 통합
- **운동 추천**: 사용자 입력 및 컨디션 기반 맞춤형 운동 추천
- **식단 추천**: 아침/점심/저녁 메뉴 추천
- **레시피 추천**: 사용자 입력 기반 레시피 추천

### 9.2 API 연동
- `getExerciseRecommendation()`: 운동 추천
- `recommendFood()`: 음식 추천 (Gemini)
- `recommendRecipe()`: 레시피 추천 (Gemini)

---

## 🎨 10. 공통 컴포넌트

### 10.1 Button
- **위치**: `src/react-native/components/Button.tsx`
- **기능**: 재사용 가능한 버튼 컴포넌트

### 10.2 Card
- **위치**: `src/react-native/components/Card.tsx`
- **기능**: 카드 형태의 컨테이너 컴포넌트

### 10.3 Badge
- **위치**: `src/react-native/components/Badge.tsx`
- **기능**: 뱃지 컴포넌트 (카테고리, 상태 표시)

### 10.4 ProgressBar
- **위치**: `src/react-native/components/ProgressBar.tsx`
- **기능**: 진행률 표시 바 컴포넌트

---

## 🔧 11. 기술 스택

### 11.1 프레임워크 및 라이브러리
- **React Native**: 0.81.5
- **Expo**: 54
- **React Navigation**: 6.x
  - Bottom Tab Navigator
  - Stack Navigator
- **Axios**: 1.13.2 (API 통신)
- **AsyncStorage**: 2.2.0 (로컬 저장소)
- **React Native WebView**: 13.16.0 (OAuth2 로그인)
- **React Native Chart Kit**: 6.12.0 (차트)
- **Expo Image Picker**: 17.0.8 (이미지 선택)

### 11.2 상태 관리
- **React Hooks**: useState, useEffect, useRef, useCallback
- **AsyncStorage**: 로컬 데이터 저장
- **Context API**: (필요시 사용 가능)

---

## 📊 12. 데이터 흐름

### 12.1 인증 흐름
```
1. 사용자가 로그인 버튼 클릭
2. WebView에서 OAuth2 로그인 페이지 표시
3. 네이버/카카오 로그인 완료
4. 백엔드 콜백 URL로 리다이렉트
5. WebView에서 쿠키/토큰 추출
6. AsyncStorage에 저장
7. 메인 화면으로 이동
```

### 12.2 API 호출 흐름
```
1. 컴포넌트에서 API 함수 호출
2. Axios 인터셉터에서 토큰/쿠키 자동 추가
3. 백엔드 API 호출
4. 응답 인터셉터에서 토큰 자동 추출 및 저장
5. 컴포넌트에 데이터 반환
```

---

## 🚀 13. 주요 기능 요약

### 13.1 완성된 기능
✅ OAuth2 소셜 로그인 (네이버, 카카오)
✅ 사용자 인증 및 세션 관리
✅ 홈 화면 (대시보드)
✅ 식단 관리 (기록, 추천, 검색)
✅ 운동 관리 (기록, 추천, 타이머)
✅ 커뮤니티 (게시글, 댓글, 좋아요)
✅ 마이페이지 (프로필, 설정)
✅ AI 추천 (운동, 식단, 레시피)
✅ 이미지 업로드
✅ 차트 시각화

### 13.2 준비 중인 기능
🔄 챌린지 (UI는 있으나 백엔드 연동 필요)
🔄 캘린더 및 이벤트 (API는 준비됨)
🔄 다크 모드
🔄 푸시 알림

---

## 📝 14. 사용 방법

### 14.1 앱 실행
```bash
cd front
npm install
npm start
# 또는
npm run android
npm run ios
```

### 14.2 로그인
1. 앱 실행 시 로그인 화면 표시
2. 네이버 또는 카카오 로그인 버튼 클릭
3. WebView에서 소셜 로그인 완료
4. 자동으로 메인 화면으로 이동

### 14.3 주요 기능 사용
- **식단 기록**: 식단 탭 → 음식 검색 → 추가
- **운동 기록**: 운동 탭 → 운동 선택 → 기록
- **게시글 작성**: 커뮤니티 탭 → 작성 버튼
- **프로필 수정**: 마이 탭 → 프로필 수정

---

## 🔒 15. 보안

### 15.1 인증
- JWT 토큰 기반 인증
- 세션 쿠키 fallback
- 자동 토큰 갱신

### 15.2 데이터 보호
- AsyncStorage에 민감 정보 저장
- HTTPS 통신 (프로덕션)
- 토큰 만료 시 자동 로그아웃

---

## 📱 16. 네비게이션 구조

```
App.tsx
├── AuthNavigator (로그인 전)
│   └── LoginScreen
└── MainTabs (로그인 후)
    ├── 홈 (Dashboard)
    ├── 식단 (FoodLogger)
    ├── 운동 (WorkoutLogger)
    ├── 챌린지 (Challenge)
    ├── 커뮤니티 (Community)
    └── 마이 (MyPage)
```

---

## 🎯 17. 향후 개선 사항

1. **오프라인 모드**: 네트워크 없이도 기본 기능 사용
2. **푸시 알림**: 운동/식단 알림
3. **소셜 공유**: 운동/식단 기록 공유
4. **통계 분석**: 장기간 데이터 분석 및 인사이트
5. **음성 인식**: 음성으로 식단/운동 기록
6. **웨어러블 연동**: 스마트워치 데이터 연동

---

## 📞 18. 지원

문제가 발생하거나 질문이 있으시면:
- GitHub Issues
- 개발팀 문의

---

**마지막 업데이트**: 2024년

