import AsyncStorage from '@react-native-async-storage/async-storage';

export type FoodApiItem = {
  id?: number | string;
  name?: string;
  calory?: number | string | null;
  carbohydrate?: number | string | null;
  protein?: number | string | null;
  fat?: number | string | null;
  foodKind?: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'RECIPE' | string | null;
  description?: string | null;
  registeredAt?: string | null;
  registered_at?: string | null;
  time?: string | null;
  date?: string | null;
};

export type NormalizedFoodLog = {
  id: number | null;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foodKind: string | null;
  registeredAt: string | null;
};

export type WeeklyCaloriesSummary = {
  labels: string[];
  data: number[];
  average: number;
  lastUpdated: string;
};

const WEEKDAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];

export const FOOD_TODAY_TOTALS_KEY = '@food:todayTotals';
export const FOOD_WEEKLY_CALORIES_KEY = '@food:weeklyCalories';

export function coerceNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (value && typeof value === 'object' && 'toString' in value) {
    const parsed = Number((value as any).toString());
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function normalizeRegisteredAt(item: FoodApiItem | null | undefined): string | null {
  if (!item) return null;
  const candidates = [
    item.registeredAt,
    item.registered_at,
    item.time,
    item.date,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const date = new Date(candidate);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}

export function normalizeFoodApiItem(item: FoodApiItem | null | undefined): NormalizedFoodLog {
  if (!item) {
    return {
      id: null,
      name: '알 수 없는 음식',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      foodKind: null,
      registeredAt: null,
    };
  }

  const numericId =
    typeof item.id === 'number'
      ? item.id
      : typeof item.id === 'string'
        ? Number(item.id)
        : null;

  let registeredAt = normalizeRegisteredAt(item);
  if (!registeredAt) {
    // 백엔드에서 registeredAt을 반환하지 않으므로, 주간 데이터는 오늘 날짜로 가정
    // 주간 조회 시에는 백엔드가 이미 필터링한 데이터이므로 오늘 날짜로 처리
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    registeredAt = today.toISOString();
  }

  return {
    id: Number.isFinite(numericId as number) ? (numericId as number) : null,
    name:
      typeof item.name === 'string' && item.name.trim().length > 0
        ? item.name.trim()
        : '추천 식단',
    calories: coerceNumber(item.calory),
    protein: coerceNumber(item.protein),
    carbs: coerceNumber(item.carbohydrate),
    fat: coerceNumber(item.fat),
    foodKind: item.foodKind ?? null,
    registeredAt,
  };
}

export function aggregateDailyTotals(logs: NormalizedFoodLog[]): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  return logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function aggregateWeeklyCalories(logs: NormalizedFoodLog[]): WeeklyCaloriesSummary {
  const totals = [0, 0, 0, 0, 0, 0, 0];
  const today = new Date();
  const currentWeekMonday = new Date(today);
  const day = currentWeekMonday.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  currentWeekMonday.setDate(currentWeekMonday.getDate() + diff);
  currentWeekMonday.setHours(0, 0, 0, 0);

  // 백엔드가 이미 주간 데이터를 필터링해서 반환하므로,
  // registeredAt이 없으면 순서대로 분배 (월요일부터)
  let dayIndex = 0;
  
  for (const log of logs) {
    if (log.registeredAt) {
      const logDate = new Date(log.registeredAt);
      if (!Number.isNaN(logDate.getTime())) {
        logDate.setHours(0, 0, 0, 0);
        const calculatedDayIndex = (logDate.getDay() + 6) % 7; // Monday = 0

        const diffDays = Math.floor(
          (logDate.getTime() - currentWeekMonday.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays >= 0 && diffDays <= 6) {
          totals[calculatedDayIndex] += log.calories;
          continue;
        }
      }
    }
    
    // registeredAt이 없거나 유효하지 않으면 순서대로 분배
    totals[dayIndex % 7] += log.calories;
    dayIndex++;
  }

  const sum = totals.reduce((acc, value) => acc + value, 0);
  const populatedDays = totals.filter(value => value > 0).length || 1;
  const average = Math.round(sum / populatedDays);

  return {
    labels: [...WEEKDAY_LABELS],
    data: totals.map(value => Math.round(value)),
    average,
    lastUpdated: new Date().toISOString(),
  };
}

export function getFoodKindLabel(kind: string | null | undefined): string {
  switch (kind) {
    case 'BREAKFAST':
      return '아침';
    case 'LUNCH':
      return '점심';
    case 'DINNER':
      return '저녁';
    case 'RECIPE':
      return '레시피';
    default:
      return '식단';
  }
}

export function formatRegisteredDate(dateString?: string | null): string | null {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function buildMealTimeLabel(kind?: string | null, registeredAt?: string | null): string {
  const kindLabel = getFoodKindLabel(kind ?? null);
  const dateLabel = formatRegisteredDate(registeredAt);
  if (dateLabel) {
    return `${dateLabel} · ${kindLabel}`;
  }
  return kindLabel;
}

export async function cacheTodayTotals(totals: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}) {
  try {
    await AsyncStorage.setItem(
      FOOD_TODAY_TOTALS_KEY,
      JSON.stringify({
        totals,
        lastUpdated: new Date().toISOString(),
      })
    );
  } catch {}
}

export async function cacheWeeklyCalories(summary: WeeklyCaloriesSummary) {
  try {
    await AsyncStorage.setItem(FOOD_WEEKLY_CALORIES_KEY, JSON.stringify(summary));
  } catch {}
}

export async function readCachedTodayTotals(): Promise<{
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} | null> {
  try {
    const stored = await AsyncStorage.getItem(FOOD_TODAY_TOTALS_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed && parsed.totals) {
      return parsed.totals;
    }
    return null;
  } catch {
    return null;
  }
}

export async function readCachedWeeklyCalories(): Promise<WeeklyCaloriesSummary | null> {
  try {
    const stored = await AsyncStorage.getItem(FOOD_WEEKLY_CALORIES_KEY);
    if (!stored) return null;
    const parsed: WeeklyCaloriesSummary = JSON.parse(stored);
    if (parsed && Array.isArray(parsed.data) && Array.isArray(parsed.labels)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

