/**
 * Dashboard 화면에서 JSESSIONID를 사용하여 API 호출하는 예시
 * 
 * 이 파일은 실제 Dashboard.tsx에서 JSESSIONID를 사용하는 방법을 보여줍니다.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../config/api';

/**
 * Dashboard 컴포넌트 예시
 * 
 * JSESSIONID를 사용하여 인증이 필요한 API를 호출하는 방법을 보여줍니다.
 */
export function DashboardExample() {
  const [jsessionId, setJsessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  // 컴포넌트 마운트 시 JSESSIONID 가져오기
  useEffect(() => {
    loadSessionCookie();
  }, []);

  const loadSessionCookie = async () => {
    try {
      // AsyncStorage에서 JSESSIONID 가져오기
      const sessionId = await AsyncStorage.getItem('JSESSIONID');
      if (sessionId) {
        setJsessionId(sessionId);
        console.log('✅ JSESSIONID 로드 완료:', sessionId);
      }
    } catch (error) {
      console.error('JSESSIONID 로드 오류:', error);
    }
  };

  /**
   * JSESSIONID를 Cookie 헤더에 포함하여 API 호출하는 예시
   */
  const fetchDataWithSession = async () => {
    if (!jsessionId) {
      Alert.alert('알림', '세션이 없습니다. 다시 로그인해주세요.');
      return;
    }

    setLoading(true);
    try {
      // JSESSIONID를 Cookie 헤더에 포함하여 API 호출
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/dashboard/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': `JSESSIONID=${jsessionId}`, // JSESSIONID를 Cookie 헤더에 포함
        },
        credentials: 'include', // 쿠키 포함
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
        console.log('✅ API 호출 성공:', data);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error('API 호출 오류:', error);
      Alert.alert('오류', `API 호출 실패: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * api.ts의 apiClient를 사용하는 경우 (권장)
   * 
   * api.ts의 setSessionCookie를 통해 JSESSIONID를 설정하면
   * 이후 모든 API 호출에 자동으로 Cookie 헤더가 포함됩니다.
   */
  const fetchDataWithApiClient = async () => {
    try {
      // api.ts의 apiClient는 이미 JSESSIONID를 Cookie 헤더에 포함하므로
      // 별도로 헤더를 설정할 필요 없음
      const { api } = await import('../../services/api');
      const response = await api.get('/api/dashboard/stats');
      
      if (response.success) {
        setData(response.data);
        console.log('✅ API 호출 성공:', response.data);
      } else {
        throw new Error(response.error || 'API 호출 실패');
      }
    } catch (error: any) {
      console.error('API 호출 오류:', error);
      Alert.alert('오류', `API 호출 실패: ${error.message}`);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Dashboard 예시
      </Text>

      {jsessionId ? (
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 12, color: '#666' }}>
            JSESSIONID: {jsessionId.substring(0, 20)}...
          </Text>
        </View>
      ) : (
        <Text style={{ fontSize: 12, color: '#999' }}>
          JSESSIONID를 로드하는 중...
        </Text>
      )}

      <View style={{ gap: 12, marginTop: 16 }}>
        <TouchableOpacity
          onPress={fetchDataWithSession}
          disabled={loading || !jsessionId}
          style={{
            backgroundColor: '#6366f1',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {loading ? '로딩 중...' : 'fetch로 API 호출 (JSESSIONID 포함)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={fetchDataWithApiClient}
          disabled={loading}
          style={{
            backgroundColor: '#10b981',
            padding: 12,
            borderRadius: 8,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {loading ? '로딩 중...' : 'apiClient로 API 호출 (자동 Cookie 포함)'}
          </Text>
        </TouchableOpacity>
      </View>

      {data && (
        <View style={{ marginTop: 24, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
            응답 데이터:
          </Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {JSON.stringify(data, null, 2)}
          </Text>
        </View>
      )}
    </View>
  );
}

