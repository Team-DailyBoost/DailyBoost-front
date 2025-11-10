# API Client 사용 가이드

이 디렉토리에는 백엔드 API와 통신하기 위한 클라이언트 코드가 포함되어 있습니다.

## 구조

- `client.ts`: Axios 인스턴스 및 인터셉터 설정
- `types.ts`: TypeScript 타입 정의 (OpenAPI 스펙 기반)
- `users.ts`: 사용자 관련 API
- `foods.ts`: 식단 관련 API
- `posts.ts`: 게시글 관련 API
- `comments.ts`: 댓글 관련 API
- `calendars.ts`: 캘린더 관련 API
- `events.ts`: 이벤트 관련 API
- `exercises.ts`: 운동 관련 API
- `gemini.ts`: AI 추천 관련 API (Gemini)
- `images.ts`: 이미지 업로드 API
- `email.ts`: 이메일 전송 API
- `index.ts`: 모든 API 함수 export

## 사용 방법

### 1. 기본 사용

```typescript
import { getTodayFoods, createPost, getUserProfile } from './src/api';

// 오늘 식단 조회
const foods = await getTodayFoods();

// 게시글 생성
const result = await createPost({
  title: '제목',
  content: '내용',
  postKind: 'EXERCISE',
});

// 사용자 프로필 조회
const user = await getUserProfile(1);
```

### 2. 인증

인증은 자동으로 처리됩니다:
- JWT 토큰이 있으면 `Authorization: Bearer {token}` 헤더 사용
- JWT 토큰이 없으면 세션 쿠키 사용 (`Cookie: JSESSIONID=xxx`)

### 3. 에러 처리

```typescript
import { getTodayFoods } from './src/api';

try {
  const foods = await getTodayFoods();
} catch (error) {
  if (error.response?.status === 401) {
    // 인증 오류 - 자동으로 로그아웃 처리됨
    // 로그인 화면으로 이동
  }
}
```

## 주의사항

1. **GET with Body**: 일부 API (`/api/recommend/exercise`, `/api/recommend/food` 등)는 GET 메서드에 `@RequestBody`를 사용하는 비표준 설계입니다. 클라이언트에서는 POST로 시도하고, 실패 시 GET with query parameters로 fallback합니다.

2. **이미지 업로드**: `/api/image/upload`는 `multipart/form-data`를 사용합니다. `uploadProfileImage` 함수를 사용하세요.

3. **인증 토큰**: OAuth2 로그인 후 WebView에서 추출한 JWT 토큰이나 세션 쿠키가 자동으로 저장되고 사용됩니다.

## API 엔드포인트 목록

### User API (`/api/user/**`)
- `getUserProfile(userId)`: 사용자 프로필 조회
- `initUserInfo(request)`: 사용자 헬스 정보 등록
- `updateUserInfo(request)`: 사용자 정보 수정
- `unregisterUser()`: 계정 등록 해제
- `recoverUserAccount(request)`: 계정 복구

### Food API (`/api/food/**`)
- `getTodayFoods()`: 일일 식단 조회
- `getWeeklyFoods()`: 주간 식단 조회
- `getFoodRecommendations()`: 하루 음식 추천
- `getRecipeRecommendation(request)`: 레시피 추천
- `searchFoods(keyword)`: 음식 키워드 검색
- `registerFood(foodId)`: 식단 기록에 추가
- `unregisterFood(foodId)`: 식단 기록에서 제거
- `resetFood()`: 일일 식단 초기화

### Post API (`/api/post/**`)
- `getPosts(postKind)`: 게시글 목록 조회
- `getPost(postId)`: 게시글 상세 조회
- `searchPosts(title)`: 게시글 제목으로 검색
- `createPost(request)`: 게시글 생성
- `updatePost(request)`: 게시글 수정
- `deletePost(postId)`: 게시글 삭제
- `likePost(postId)`: 게시글 좋아요
- `unlikePost(postId)`: 게시글 좋아요 취소

### Comment API (`/api/comment/**`)
- `getComments(postId)`: 댓글 목록 조회
- `createComment(request)`: 댓글 생성
- `updateComment(request)`: 댓글 수정
- `deleteComment(request)`: 댓글 삭제
- `likeComment(commentId)`: 댓글 좋아요
- `unlikeComment(commentId)`: 댓글 좋아요 취소

### Calendar API (`/api/calendar/**`)
- `getCalendars()`: 캘린더 목록 조회
- `getCalendar(calendarId)`: 캘린더 상세 조회
- `createCalendar(request)`: 캘린더 생성
- `updateCalendar(request)`: 캘린더 수정
- `deleteCalendar(calendarId)`: 캘린더 삭제
- `inviteUsersToCalendar(calendarId, request)`: 캘린더에 사용자 초대

### Event API (`/api/event/**`)
- `getEvents(calendarId, rangeStart, rangeEnd)`: 이벤트 목록 조회
- `getEvent(eventId, calendarId)`: 이벤트 상세 조회
- `createEvent(request)`: 이벤트 생성
- `updateEvent(request)`: 이벤트 수정
- `deleteEvent(request)`: 이벤트 삭제

### Exercise API (`/api/exercise/**`, `/api/recommend/exercise`)
- `registerExercise(request)`: 운동 등록
- `getExerciseRecommendation(request)`: 운동 추천

### Gemini API (`/api/recommend/**`)
- `recommendFood(request)`: 음식 추천 (Gemini)
- `recommendRecipe(request)`: 레시피 추천 (Gemini)

### Image API (`/api/image/**`)
- `uploadProfileImage(uri, fileName?, mimeType?)`: 프로필 이미지 업로드

### Email API (`/api/email/**`)
- `sendHtmlEmail(request)`: 이메일 전송 (계정 복구 코드)
