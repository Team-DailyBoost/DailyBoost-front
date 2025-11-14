export type FallbackExercise = {
  name: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  youtubeLink: string;
  part: 'CHEST' | 'BACK' | 'SHOULDER' | 'LOWER_BODY' | 'BICEPS' | 'TRICEPS' | 'CARDIO' | 'HOME_TRAINING';
  duration?: number;
};

export const FALLBACK_EXERCISE_RECOMMENDATIONS: FallbackExercise[] = [
  {
    name: '전신 스트레칭',
    description:
      '가볍게 목, 어깨, 허리를 풀어주는 전신 스트레칭으로 5분간 몸을 풀어주세요. 각 동작은 30초씩 유지합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=F1-67pZ6a80',
    part: 'HOME_TRAINING',
    duration: 5,
  },
  {
    name: '스쿼트',
    description:
      '발을 어깨너비로 벌리고 가슴을 펴서 천천히 앉았다 일어나는 동작을 15회씩 3세트 진행하세요. 무릎이 발끝을 넘지 않도록 주의합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=aclHkVaku9U',
    part: 'LOWER_BODY',
    duration: 10,
  },
  {
    name: '푸시업',
    description:
      '무릎을 바닥에 대고 상체를 곧게 유지한 채 팔꿈치를 굽혔다 펴는 동작을 12회씩 3세트 진행합니다. 자세가 익숙해지면 무릎을 떼고 진행하세요.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=_l3ySVKYVJ8',
    part: 'CHEST',
    duration: 8,
  },
  {
    name: '플랭크',
    description:
      '어깨와 팔꿈치를 일직선으로 맞추고 코어에 힘을 준 채 40초 동안 버텨주세요. 3세트 반복하며 호흡을 고르게 유지합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=BQu26ABuVS0',
    part: 'CARDIO',
    duration: 6,
  },
  {
    name: '런지',
    description:
      '한 발을 앞으로 내딛고 무릎을 90도로 굽혀 앉았다 일어나는 동작을 좌우 12회씩 3세트 진행하세요. 상체는 곧게 유지합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=QOVaHwm-Q6U',
    part: 'LOWER_BODY',
    duration: 8,
  },
];

export type FallbackFoodRecommendation = {
  id: string;
  name: string;
  calory: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  foodKind: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  description: string;
};

export const FALLBACK_FOOD_RECOMMENDATIONS: FallbackFoodRecommendation[] = [
  {
    id: 'fallback_breakfast',
    name: '귀리 요거트 볼',
    calory: 420,
    carbohydrate: 55,
    protein: 22,
    fat: 12,
    foodKind: 'BREAKFAST',
    description:
      '플레인 요거트에 귀리, 블루베리, 아몬드를 곁들여 단백질과 식이섬유를 동시에 챙겨보세요.',
  },
  {
    id: 'fallback_lunch',
    name: '닭가슴살 현미 비빔밥',
    calory: 560,
    carbohydrate: 68,
    protein: 38,
    fat: 14,
    foodKind: 'LUNCH',
    description:
      '현미밥에 닭가슴살과 다양한 채소를 곁들인 비빔밥으로 포만감과 영양 균형을 확보하세요.',
  },
  {
    id: 'fallback_dinner',
    name: '연어 구이와 단호박 샐러드',
    calory: 480,
    carbohydrate: 35,
    protein: 32,
    fat: 20,
    foodKind: 'DINNER',
    description:
      '오븐에 구운 연어와 단호박, 시금치를 곁들인 샐러드로 가벼우면서도 단백질을 충분히 섭취합니다.',
  },
];

