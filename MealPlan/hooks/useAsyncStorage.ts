import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * AsyncStorage를 useState처럼 사용할 수 있게 해주는 커스텀 훅
 * 
 * @param key - AsyncStorage 키
 * @param initialValue - 초기값
 * @returns [storedValue, setValue, loading, error]
 */
export function useAsyncStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => Promise<void>, boolean, Error | null] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // 초기 로드
  useEffect(() => {
    const loadStoredValue = async () => {
      try {
        setLoading(true);
        const item = await AsyncStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (err) {
        console.error(`Error loading ${key}:`, err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadStoredValue();
  }, [key]);

  // 값 저장 함수
  const setValue = useCallback(
    async (value: T) => {
      try {
        setStoredValue(value);
        await AsyncStorage.setItem(key, JSON.stringify(value));
        setError(null);
      } catch (err) {
        console.error(`Error saving ${key}:`, err);
        setError(err as Error);
      }
    },
    [key]
  );

  return [storedValue, setValue, loading, error];
}

/**
 * 여러 AsyncStorage 값을 한번에 로드하는 훅
 * 
 * @param keys - AsyncStorage 키 배열
 * @returns [values, loading, error]
 */
export function useMultiAsyncStorage(
  keys: string[]
): [Record<string, any>, boolean, Error | null] {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadMultipleValues = async () => {
      try {
        setLoading(true);
        const pairs = await AsyncStorage.multiGet(keys);
        const result: Record<string, any> = {};
        
        pairs.forEach(([key, value]) => {
          if (value !== null) {
            try {
              result[key] = JSON.parse(value);
            } catch {
              result[key] = value;
            }
          }
        });
        
        setValues(result);
      } catch (err) {
        console.error('Error loading multiple values:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    if (keys.length > 0) {
      loadMultipleValues();
    } else {
      setLoading(false);
    }
  }, [keys.join(',')]);

  return [values, loading, error];
}
