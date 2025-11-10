# 소셜 로그인 구현 가이드

## 개요

이 디렉토리에는 Spring Boot OAuth2 소셜 로그인을 React Native에서 처리하는 컴포넌트들이 있습니다.

## 핵심 제약 조건

**백엔드(Spring Boot) 코드는 수정할 수 없습니다.**

Spring Boot의 OAuth2 인증이 완료되면 "Whitelabel Error Page"를 반환합니다. 이 페이지가 로드되면 "로그인 완료"로 간주하고, WebView에서 JSESSIONID 쿠키를 추출하여 이후 API 요청에 사용합니다.

## 파일 구조

- `Login.tsx`: 기본 로그인 화면 (이메일/비밀번호 + 소셜 로그인 버튼)
- `SocialLoginScreen.tsx`: WebView를 사용한 소셜 로그인 전용 화면
- `SocialLoginScreen.usage.example.tsx`: React Navigation 사용 예시

## SocialLoginScreen 사용법

### 1. 기본 사용 (Modal 방식)

```tsx
import { SocialLoginScreen } from './screens/Auth/SocialLoginScreen';

// Modal로 표시
<Modal visible={showSocialLogin}>
  <SocialLoginScreen provider="naver" />
</Modal>
```

### 2. React Navigation 사용 (권장)

```tsx
import { createStackNavigator } from '@react-navigation/stack';
import { SocialLoginScreen } from './screens/Auth/SocialLoginScreen';

const Stack = createStackNavigator();

<Stack.Navigator>
  <Stack.Screen 
    name="SocialLogin" 
    component={SocialLoginScreen}
    // provider는 route.params로 전달
  />
</Stack.Navigator>

// 로그인 화면에서 호출
navigation.navigate('SocialLogin', { provider: 'naver' });
```

### 3. 카카오/네이버 선택

```tsx
// 네이버 로그인
<SocialLoginScreen provider="naver" />

// 카카오 로그인
<SocialLoginScreen provider="kakao" />
```

## 동작 흐름

1. **소셜 로그인 버튼 클릭**
   - `SocialLoginScreen` 컴포넌트가 `provider` prop을 받아서 OAuth2 URL 생성
   - 예: `http://서버주소/oauth2/authorization/naver`

2. **WebView에서 OAuth2 인증**
   - WebView가 네이버/카카오 로그인 페이지를 표시
   - 사용자가 로그인 완료

3. **백엔드로 리다이렉트**
   - Spring Boot가 OAuth2 콜백 처리
   - 최종적으로 "Whitelabel Error Page" 응답

4. **Whitelabel 페이지 감지**
   - `onNavigationStateChange` 또는 `onLoadEnd`에서 페이지 title/URL 확인
   - "Whitelabel Error Page" 포함 여부 확인

5. **쿠키 추출**
   - `injectedJavaScript`로 `document.cookie` 읽기
   - `JSESSIONID` 추출하여 AsyncStorage에 저장

6. **세션 유효성 확인**
   - API 호출로 세션이 유효한지 확인
   - 유효하면 사용자 정보 저장

7. **홈 화면으로 이동**
   - `navigation.replace('Home')` 또는 `navigation.replace('홈')` 호출
   - 로그인 완료

## 쿠키 추출 방법

### 현재 방법 (WebView injectedJavaScript)

```tsx
// SocialLoginScreen.tsx 내부
const cookieScript = `
  (function() {
    const cookies = document.cookie;
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'cookies',
      cookies: cookies
    }));
  })();
  true;
`;
webViewRef.current.injectJavaScript(cookieScript);
```

### 대안: @react-native-cookies/cookies (선택사항)

```bash
npm install @react-native-cookies/cookies
```

```tsx
import CookieManager from '@react-native-cookies/cookies';

// WebView URL에서 쿠키 가져오기
const cookies = await CookieManager.get(API_CONFIG.BASE_URL);
const jsessionId = cookies.JSESSIONID?.value;
```

**참고**: WebView의 쿠키를 직접 읽기 위해서는 `injectedJavaScript` 방법이 더 안정적입니다.

## 커스터마이징

### 다른 소셜 로그인 제공자 추가

```tsx
// SocialLoginScreen.tsx의 provider 타입 확장
type SocialProvider = 'naver' | 'kakao' | 'google' | 'facebook';

interface SocialLoginScreenProps {
  provider: SocialProvider;
}

// OAuth2 URL 생성
const authUrl = `${API_CONFIG.BASE_URL}/oauth2/authorization/${provider}`;
```

### 홈 화면 이름 변경

```tsx
// SocialLoginScreen.tsx 내부
// 현재: navigation.replace('홈')
// 변경: navigation.replace('Dashboard') 또는 원하는 화면 이름
```

## 트러블슈팅

### Whitelabel 페이지가 감지되지 않는 경우

1. **백엔드 리다이렉트 확인**
   - `onNavigationStateChange`에서 URL 로그 확인
   - 백엔드 도메인으로 리다이렉트되었는지 확인

2. **타이밍 문제**
   - 페이지 로드 완료 후 1초 지연 후 쿠키 추출
   - 필요시 지연 시간 조정

3. **쿠키 추출 실패**
   - `document.cookie`가 비어있을 수 있음
   - 백엔드에서 쿠키가 제대로 설정되었는지 확인

### 세션이 유효하지 않은 경우

1. **쿠키 저장 확인**
   - AsyncStorage에 JSESSIONID가 저장되었는지 확인
   - `api.setSessionCookie()` 호출 확인

2. **API 요청 헤더 확인**
   - `src/services/api.ts`에서 Cookie 헤더가 포함되는지 확인
   - `credentials: 'include'` 옵션 확인

## 참고 자료

- [React Native WebView 문서](https://github.com/react-native-webview/react-native-webview)
- [React Navigation 문서](https://reactnavigation.org/)
- [Spring Boot OAuth2](https://spring.io/guides/tutorials/spring-boot-oauth2/)

