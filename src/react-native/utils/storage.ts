import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  FOOD_ENTRIES: 'foodEntries',
  WORKOUT_ENTRIES: 'workoutEntries',
  USER_INFO: 'userInfo',
  DAILY_GOALS: 'dailyGoals',
  CHALLENGES: 'challenges',
  FAVORITES: 'favorites',
} as const;

export const saveData = async <T>(key: string, data: T): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch {
    throw new Error(`Failed to save data for key ${key}`);
  }
};

export const loadData = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    throw new Error(`Failed to remove data for key ${key}`);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch {
    throw new Error('Failed to clear all data');
  }
};

export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    return await AsyncStorage.getAllKeys();
  } catch {
    return [];
  }
};
