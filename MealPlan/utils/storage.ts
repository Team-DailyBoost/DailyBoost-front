import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage 헬퍼 함수들

export const StorageKeys = {
  FOOD_ENTRIES: 'foodEntries',
  WORKOUT_ENTRIES: 'workoutEntries',
  USER_INFO: 'userInfo',
  DAILY_GOALS: 'dailyGoals',
  CHALLENGES: 'challenges',
  FAVORITES: 'favorites',
} as const;

/**
 * 데이터 저장
 */
export const saveData = async <T>(key: string, data: T): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(data);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (error) {
    console.error(`Error saving data for key ${key}:`, error);
    throw error;
  }
};

/**
 * 데이터 불러오기
 */
export const loadData = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
  } catch (error) {
    console.error(`Error loading data for key ${key}:`, error);
    return defaultValue;
  }
};

/**
 * 데이터 삭제
 */
export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
    throw error;
  }
};

/**
 * 모든 데이터 삭제
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing all data:', error);
    throw error;
  }
};

/**
 * 저장된 모든 키 가져오기
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};
