import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { WebView, WebViewMessageEvent, WebViewNavigation } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../../config/api';
import { api } from '../../../services/api';

type Provider = 'naver' | 'kakao';

type RouteParams = {
  provider: Provider;
};

type SocialLoginScreenProps = {
  onLoggedIn: () => void;
};

export function SocialLoginScreen({ onLoggedIn }: SocialLoginScreenProps) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const webViewRef = useRef<WebView>(null);

  // 👉 네비게이션에서 넘겨준 provider 사용
  const provider: Provider = route.params?.provider ?? 'naver';

  const [loading, setLoading] = useState(true);

  // Spring OAuth2 엔드포인트
  const authUrl = `${API_CONFIG.BASE_URL}/oauth2/authorization/${provider}`;

  // 🔥 WebView에서 postMessage로 온 토큰 처리
  const handleWebViewMessage = async (event: WebViewMessageEvent) => {
    try {
      const raw = event.nativeEvent.data;
      console.log('[SocialLogin] onMessage raw =', raw);

      if (!raw || typeof raw !== 'string') {
        return;
      }

      const data = JSON.parse(raw);

      if (data.type !== 'token' || typeof data.jwtToken !== 'string') {
        console.log('[SocialLogin] token message 아님:', data.type);
        return;
      }

      const accessToken: string = data.jwtToken.trim();
      const refreshToken: string | null =
        typeof data.refreshToken === 'string' ? data.refreshToken.trim() : null;

      if (!accessToken) {
        Alert.alert('로그인 오류', '액세스 토큰을 받지 못했습니다.');
        return;
      }

      console.log('[SocialLogin] 토큰 수신 성공', {
        accessPreview: accessToken.substring(0, 20) + '...',
        refreshPreview: refreshToken ? refreshToken.substring(0, 20) + '...' : 'null',
      });

      // ✅ 1) Axios 기본 헤더 설정
      const bearer = accessToken.startsWith('Bearer ')
        ? accessToken
        : `Bearer ${accessToken}`;
      await api.setAuthToken(bearer);

      // ✅ 2) AsyncStorage에 토큰 저장
      await AsyncStorage.setItem(
        '@accessToken',
        bearer.replace(/^Bearer\s+/i, ''),
      );
      if (refreshToken) {
        await AsyncStorage.setItem('@refreshToken', refreshToken);
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }

      // ✅ 3) (선택) /api/user/profile 같은 곳에서 진짜 유저 정보 가져오기
      // 일단은 임시 유저 정보만 저장
      const tempUser = {
        email: null,
        name: provider === 'kakao' ? '카카오 사용자' : '네이버 사용자',
        id: `${provider}_${Date.now()}`,
        provider,
        loginAt: Date.now(),
      };
      await AsyncStorage.setItem('currentUser', JSON.stringify(tempUser));

      // ✅ 4) App의 isAuthed를 true로
      console.log('[SocialLogin] 로그인 성공, onLoggedIn 호출');
      console.log('[SocialLogin] onLoggedIn 함수 존재:', typeof onLoggedIn);
      onLoggedIn();
      console.log('[SocialLogin] onLoggedIn 호출 완료');
    } catch (error) {
      console.error('[SocialLogin] onMessage 처리 실패:', error);
      Alert.alert('로그인 실패', '로그인 처리 중 오류가 발생했습니다.');
    }
  };

  // 🔥 딥링크(dailyboost://...)는 WebView에서 열지 않도록 막기 (옵션)
  const handleShouldStart = (request: WebViewNavigation) => {
    const url = request.url;
    console.log('[SocialLogin] shouldStart url =', url);

    if (url.startsWith('dailyboost://')) {
      console.log('[SocialLogin] 딥링크 감지 (무시):', url);
      // 여기서 URL 파싱해서 access/refresh 직접 뽑아서 처리해도 됨 (선택)
      return false; // WebView에서 이 URL로 이동하지 않게 막음
    }

    return true;
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: authUrl }}
        onMessage={handleWebViewMessage}
        onShouldStartLoadWithRequest={handleShouldStart}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        style={styles.webview}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>
            {provider === 'naver' ? '네이버' : '카카오'} 로그인 중...
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕ 닫기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(249, 250, 251, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});
