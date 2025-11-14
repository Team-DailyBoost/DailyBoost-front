export type NormalizedFoodRecommendation = {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const MEAL_LABEL_BY_TYPE: Record<NormalizedFoodRecommendation['mealType'], string> = {
  breakfast: '🌅 아침',
  lunch: '🌞 점심',
  dinner: '🌙 저녁',
};

const ARRAY_CANDIDATE_KEYS = [
  'value',
  'values',
  'foodInfoDto',
  'foodInfos',
  'recommendations',
  'items',
  'list',
  'data',
];

function resolveMealType(source: unknown): NormalizedFoodRecommendation['mealType'] {
  if (typeof source !== 'string') {
    return 'dinner';
  }

  const lowered = source.toLowerCase();

  if (lowered.includes('breakfast') || lowered.includes('morning') || lowered.includes('아침')) {
    return 'breakfast';
  }
  if (lowered.includes('lunch') || lowered.includes('noon') || lowered.includes('점심')) {
    return 'lunch';
  }
  if (lowered.includes('dinner') || lowered.includes('evening') || lowered.includes('저녁')) {
    return 'dinner';
  }

  return 'dinner';
}

function ensureArray(source: unknown): unknown[] {
  if (Array.isArray(source)) {
    return source;
  }

  if (!source || typeof source !== 'object') {
    return [];
  }

  const candidate = source as Record<string, unknown>;

  for (const key of ARRAY_CANDIDATE_KEYS) {
    const value = candidate[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  for (const value of Object.values(candidate)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function toNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return 0;
    }
    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function fallbackDescription(
  mealType: NormalizedFoodRecommendation['mealType'],
  description?: unknown,
) {
  if (typeof description === 'string' && description.trim().length > 0) {
    return description.trim();
  }
  return MEAL_LABEL_BY_TYPE[mealType];
}

function coerceId(value: unknown, index: number): string {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  return index.toString();
}

export function normalizeFoodRecommendations(source: unknown): NormalizedFoodRecommendation[] {
  const list = ensureArray(source);

  if (list.length === 0) {
    return [];
  }

  return list
    .map((item, index) => {
      if (!item || typeof item !== 'object') {
        return null;
      }

      const candidate = item as Record<string, unknown>;

      const mealType = candidate.mealType
        ? resolveMealType(candidate.mealType)
        : resolveMealType(candidate.foodKind ?? candidate.type ?? candidate.mealTypeLabel);

      const normalized: NormalizedFoodRecommendation = {
        id: coerceId(candidate.id ?? candidate.foodId ?? candidate.code, index),
        mealType,
        name:
          typeof candidate.name === 'string' && candidate.name.trim().length > 0
            ? candidate.name.trim()
            : '추천 식단',
        description: fallbackDescription(mealType, candidate.description ?? candidate.summary),
        calories: toNumber(candidate.calories ?? candidate.calory ?? candidate.kcal),
        protein: toNumber(candidate.protein ?? candidate.proteinGram),
        carbs: toNumber(candidate.carbs ?? candidate.carbohydrate ?? candidate.carb),
        fat: toNumber(candidate.fat ?? candidate.fatGram),
      };

      return normalized;
    })
    .filter((item): item is NormalizedFoodRecommendation => item !== null);
}
