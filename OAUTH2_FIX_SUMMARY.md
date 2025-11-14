# OAuth2 로그인 하얀 화면 문제 해결 요약

## 문제 상황

네이버 OAuth2 로그인 후 백엔드 콜백 URL(`https://dailyboost.duckdns.org/login/oauth2/code/naver`)에 도착했을 때 WebView가 하얀 화면으로 멈추는 문제가 발생했습니다.

## 해결 방법

### 1. WebView 콜백 URL 차단 (`src/screens/LoginWebView.tsx`)

**핵심 해결책**: `onShouldStartLoadWithRequest`에서 콜백 URL을 감지하고 즉시 차단합니다.

```typescript
const handleShouldStartLoadWithRequest = useCallback(
  (req: any) => {
    const url: string = req.url || '';
    
    // 콜백 URL 감지
    if (url.startsWith(callbackPrefix)) {
      console.log('✅ 로그인 성공 콜백 URL 감지:', url);
      
      setLoginCompleted(true);
      
      // WebView 로딩 중지
      if (webViewRef.current) {
        webViewRef.current.stopLoading();
      }
      
      // 사용자 정보 저장 및 메인 화면으로 이동
      // ...
      
      // 이 URL은 WebView에서 로드하지 않음 (하얀 화면 방지)
      return false;
    }
    
    return true;
  },
  [navigation, onLoginSuccess, loginCompleted, callbackPrefix],
);
```

**작동 원리**:
- 콜백 URL이 로드되려는 순간 `onShouldStartLoadWithRequest`가 호출됩니다.
- `return false`를 반환하면 WebView는 해당 URL을 로드하지 않습니다.
- 따라서 하얀 화면이 표시되지 않고, RN 네이티브 화면으로 즉시 이동합니다.

### 2. 쿠키 추출 및 저장

**문제**: WebView에서 받은 세션 쿠키를 React Native의 axios 요청에 사용할 수 없습니다.

**해결책**: `injectedJavaScript`로 `document.cookie`를 읽어서 RN으로 전송하고, `onMessage`에서 AsyncStorage에 저장합니다.

```typescript
// injectedJavaScript
const injectedJS = `
  (function() {
    function send() {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'COOKIE_DUMP',
        href: window.location.href,
        cookie: document.cookie || ''
      }));
    }
    
    send();
    setInterval(send, 1000); // 1초마다 전송
  })();
  true;
`;

// onMessage 핸들러
const handleMessage = useCallback(async (event: any) => {
  const data = JSON.parse(event.nativeEvent.data);
  
  if (data.type === 'COOKIE_DUMP' && data.cookie) {
    await AsyncStorage.setItem('@sessionCookie', data.cookie);
  }
}, []);
```

### 3. Axios 인터셉터로 쿠키 자동 추가 (`src/api/client.ts`)

**문제**: 매번 API 호출 시 쿠키를 수동으로 헤더에 추가해야 합니다.

**해결책**: Axios 요청 인터셉터에서 AsyncStorage에 저장된 쿠키를 자동으로 헤더에 추가합니다.

```typescript
client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // JWT 토큰 확인 (우선)
    const token = await AsyncStorage.getItem('@accessToken');
    
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
      };
    } else {
      // JWT 토큰이 없으면 세션 쿠키 사용
      const cookie = await AsyncStorage.getItem('@sessionCookie');
      
      if (cookie) {
        const cookieValue = cookie.includes(';') 
          ? cookie.split(';')[0] 
          : cookie;
        
        config.headers = {
          ...config.headers,
          Cookie: cookieValue,
        };
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);
```

**우선순위**:
1. JWT 토큰이 있으면 `Authorization: Bearer <token>` 헤더 사용
2. JWT 토큰이 없고 쿠키가 있으면 `Cookie: JSESSIONID=xxx` 헤더 사용

## 파일 구조

```
front/
├── src/
│   ├── api/
│   │   ├── client.ts              # Axios 인스턴스 및 인터셉터
│   │   ├── foods.ts               # 식단 API
│   │   ├── users.ts               # 사용자 API
│   │   ├── posts.ts               # 게시글 API
│   │   ├── comments.ts            # 댓글 API
│   │   ├── calendars.ts           # 캘린더 API
│   │   ├── events.ts              # 이벤트 API
│   │   ├── exercises.ts           # 운동 API
│   │   ├── gemini.ts              # AI 추천 API
│   │   ├── images.ts              # 이미지 업로드 API
│   │   ├── email.ts               # 이메일 API
│   │   └── types.ts               # TypeScript 타입 정의
│   ├── screens/
│   │   └── LoginWebView.tsx       # OAuth2 로그인 WebView
│   └── storage/
│       └── session.ts             # 세션 관리 헬퍼
```

## 사용 방법

### 1. 로그인 화면에서 LoginWebView 사용

```typescript
import LoginWebView from '../screens/LoginWebView';

function LoginScreen({ onLoggedIn }: { onLoggedIn: () => void }) {
  return (
    <LoginWebView
      provider="naver" // 또는 "kakao"
      onLoginSuccess={onLoggedIn}
    />
  );
}
```

### 2. API 호출

```typescript
import { getTodayFoods } from '../api/foods';

// 쿠키/토큰이 자동으로 헤더에 추가됩니다
const foods = await getTodayFoods();
```

## 주요 변경 사항

### `src/screens/LoginWebView.tsx`
- ✅ `onShouldStartLoadWithRequest`에서 콜백 URL 차단
- ✅ `injectedJavaScript`로 쿠키 추출
- ✅ `onMessage`에서 쿠키를 AsyncStorage에 저장
- ✅ 로그인 성공 시 WebView 숨김 및 메인 화면으로 이동

### `src/api/client.ts`
- ✅ 요청 인터셉터에서 JWT 토큰 또는 쿠키 자동 추가
- ✅ 응답 인터셉터에서 JWT 토큰 자동 추출 및 저장
- ✅ 401/403 응답 시 자동 로그아웃 처리

### API 모듈들 (`src/api/*.ts`)
- ✅ OpenAPI 3.1 명세 기반 TypeScript 타입 정의
- ✅ 모든 API 엔드포인트 함수 구현
- ✅ 이미지 업로드는 FormData 사용 (Swagger 명세와 다름)

## 테스트 체크리스트

- [ ] 네이버 로그인 성공 후 하얀 화면이 나타나지 않음
- [ ] 로그인 성공 후 메인 화면으로 자동 이동
- [ ] 쿠키가 AsyncStorage에 저장됨
- [ ] API 호출 시 쿠키가 자동으로 헤더에 추가됨
- [ ] JWT 토큰이 있으면 쿠키 대신 JWT 토큰 사용
- [ ] 401/403 응답 시 자동 로그아웃

## 주의 사항

1. **쿠키 형식**: `document.cookie`는 `"JSESSIONID=xxx; Path=/"` 형식이지만, HTTP 헤더에는 `"JSESSIONID=xxx"`만 필요합니다. 인터셉터에서 자동으로 처리합니다.

2. **HttpOnly 쿠키**: `document.cookie`로는 HttpOnly 쿠키를 읽을 수 없습니다. 백엔드가 HttpOnly 쿠키만 사용하는 경우 이 방법으로는 작동하지 않습니다.

3. **JWT 토큰 우선**: JWT 토큰과 쿠키가 모두 있는 경우 JWT 토큰을 우선 사용합니다.

4. **콜백 URL 감지**: 콜백 URL은 정확히 일치해야 합니다. 백엔드 URL이 변경되면 `CALLBACK_PREFIX`도 수정해야 합니다.

## 문제 해결 로그

### 문제 1: 하얀 화면
**증상**: 콜백 URL에서 WebView가 하얀 화면으로 멈춤
**원인**: WebView가 콜백 URL을 그대로 로드하려고 시도
**해결**: `onShouldStartLoadWithRequest`에서 콜백 URL 차단

### 문제 2: 쿠키 전달 불가
**증상**: WebView에서 받은 쿠키를 axios 요청에 사용할 수 없음
**원인**: WebView와 React Native는 쿠키를 공유하지 않음
**해결**: `injectedJavaScript`로 쿠키 추출 → `postMessage`로 전송 → AsyncStorage 저장 → 인터셉터에서 헤더에 추가

### 문제 3: 매번 쿠키 수동 추가
**증상**: API 호출 시마다 쿠키를 수동으로 헤더에 추가해야 함
**원인**: 인터셉터가 없음
**해결**: Axios 요청 인터셉터에서 자동으로 쿠키 추가

## 참고 자료

- [React Native WebView 문서](https://github.com/react-native-webview/react-native-webview)
- [Axios 인터셉터 문서](https://axios-http.com/docs/interceptors)
- [OAuth2 인증 플로우](https://oauth.net/2/)

