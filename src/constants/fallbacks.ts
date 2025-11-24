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
  {
    name: '데드리프트',
    description:
      '발을 어깨너비로 벌리고 바벨을 잡아 엉덩이와 무릎을 구부려 내려갔다 올라오는 동작을 8회씩 4세트 진행하세요. 등은 곧게 유지합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=op9kVnSso6Q',
    part: 'BACK',
    duration: 15,
  },
  {
    name: '벤치프레스',
    description:
      '평평한 벤치에 누워 바벨을 가슴까지 내렸다 올리는 동작을 10회씩 4세트 진행하세요. 어깨와 팔꿈치가 안정적으로 움직이도록 주의합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    part: 'CHEST',
    duration: 20,
  },
  {
    name: '숄더프레스',
    description:
      '어깨너비로 발을 벌리고 서서 바벨을 머리 위로 올렸다 내리는 동작을 12회씩 3세트 진행하세요. 코어에 힘을 주어 균형을 유지합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    part: 'SHOULDER',
    duration: 12,
  },
  {
    name: '바이셉 컬',
    description:
      '덤벨을 잡고 팔꿈치를 고정한 채 이두근에 집중하여 구부렸다 펴는 동작을 15회씩 3세트 진행하세요.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    part: 'BICEPS',
    duration: 10,
  },
  {
    name: '트라이셉 딥스',
    description:
      '의자나 벤치에 손을 대고 몸을 내렸다 올리는 동작을 12회씩 3세트 진행하세요. 팔꿈치는 몸통에 가깝게 유지합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=6kALZikXxLc',
    part: 'TRICEPS',
    duration: 10,
  },
  {
    name: '러닝',
    description:
      '30분간 중강도로 달리기를 진행하세요. 호흡을 고르게 유지하며 주 3-4회 실시하면 심폐지구력 향상에 도움이 됩니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=2s4slliAtQU',
    part: 'CARDIO',
    duration: 30,
  },
  {
    name: '버피',
    description:
      '스쿼트 자세에서 플랭크로 넘어간 뒤 푸시업을 하고 다시 스쿼트로 돌아와 점프하는 동작을 10회씩 3세트 진행하세요.',
    level: 'ADVANCED',
    youtubeLink: 'https://www.youtube.com/watch?v=TU8QYVW0gDU',
    part: 'CARDIO',
    duration: 10,
  },
  {
    name: '레그 프레스',
    description:
      '레그 프레스 머신에 앉아 다리를 구부렸다 펴는 동작을 15회씩 4세트 진행하세요. 무릎이 발끝을 넘지 않도록 주의합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=IZxyjW7MPJQ',
    part: 'LOWER_BODY',
    duration: 15,
  },
  {
    name: '라잉 레그레이즈',
    description:
      '바닥에 누워 다리를 직각으로 올렸다 내리는 동작을 15회씩 3세트 진행하세요. 복부에 집중하여 천천히 움직입니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=JB2oyawG9KI',
    part: 'HOME_TRAINING',
    duration: 8,
  },
  {
    name: '마운틴 클라이머',
    description:
      '플랭크 자세에서 번갈아 가며 무릎을 가슴에 가져오는 동작을 빠르게 30초씩 3세트 진행하세요.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=nmwgirgXLYM',
    part: 'CARDIO',
    duration: 5,
  },
  {
    name: '풀업',
    description:
      '철봉에 매달려 몸을 올렸다 내리는 동작을 8회씩 3세트 진행하세요. 등 근육에 집중하며 천천히 움직입니다.',
    level: 'ADVANCED',
    youtubeLink: 'https://www.youtube.com/watch?v=eGo4IYlbE5g',
    part: 'BACK',
    duration: 12,
  },
  {
    name: '사이드 플랭크',
    description:
      '한쪽 팔꿈치로 지지하며 몸을 일직선으로 유지하는 자세를 좌우 각 30초씩 3세트 진행하세요.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=K2VljzCC16g',
    part: 'HOME_TRAINING',
    duration: 6,
  },
  {
    name: '점핑 스쿼트',
    description:
      '일반 스쿼트에서 점프를 추가한 동작을 15회씩 3세트 진행하세요. 착지 시 무릎에 충격이 적도록 주의합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=YaXPRqUwItQ',
    part: 'CARDIO',
    duration: 8,
  },
  {
    name: '크런치',
    description:
      '바닥에 누워 무릎을 구부리고 상체를 올렸다 내리는 동작을 20회씩 3세트 진행하세요. 목에 힘을 주지 않도록 주의합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=Xyd_fa5zoEU',
    part: 'HOME_TRAINING',
    duration: 8,
  },
  {
    name: '레터럴 레이즈',
    description:
      '덤벨을 양손에 잡고 팔을 옆으로 벌렸다 내리는 동작을 12회씩 3세트 진행하세요. 어깨 근육에 집중합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=3VcKaXpzqRo',
    part: 'SHOULDER',
    duration: 10,
  },
  // CHEST 추가 (5개 이상)
  {
    name: '덤벨 플라이',
    description:
      '덤벨을 양손에 잡고 팔을 벌렸다 모으는 동작을 12회씩 3세트 진행하세요. 가슴 근육의 신전에 집중합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=eozdVDA78K0',
    part: 'CHEST',
    duration: 12,
  },
  {
    name: '인클라인 푸시업',
    description:
      '발을 높은 곳에 올리고 상체를 아래로 내려 푸시업을 하는 동작을 12회씩 3세트 진행하세요. 상부 가슴 근육을 타겟합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=0pkjOk0EiBg',
    part: 'CHEST',
    duration: 10,
  },
  {
    name: '딥스',
    description:
      '의자나 벤치에 손을 대고 몸을 내렸다 올리는 동작을 12회씩 3세트 진행하세요. 가슴과 어깨, 삼두근을 동시에 운동합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=2G14fP6q4o8',
    part: 'CHEST',
    duration: 10,
  },
  {
    name: '덤벨 크런치',
    description:
      '덤벨을 가슴에 올리고 크런치 동작을 하는 것으로 15회씩 3세트 진행하세요. 가슴과 코어를 동시에 단련합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=0tn5K9NlCfo',
    part: 'CHEST',
    duration: 8,
  },
  // BACK 추가 (5개 이상)
  {
    name: '원암 덤벨 로우',
    description:
      '한 손과 한 무릎을 벤치에 올리고 다른 손에 덤벨을 잡아 당기는 동작을 좌우 12회씩 3세트 진행하세요. 등 근육에 집중합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=pYcpY20QaE8',
    part: 'BACK',
    duration: 15,
  },
  {
    name: '바벨 로우',
    description:
      '상체를 약간 기울이고 바벨을 당겨 등 중부를 자극하는 동작을 10회씩 4세트 진행하세요. 어깨를 뒤로 당겨 등 근육을 수축합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=9efgcAjQe7E',
    part: 'BACK',
    duration: 15,
  },
  {
    name: '랫풀다운',
    description:
      '래트풀다운 머신에 앉아 손을 어깨보다 넓게 벌리고 바를 가슴까지 당기는 동작을 12회씩 3세트 진행하세요.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=CAwf7n6Luuc',
    part: 'BACK',
    duration: 12,
  },
  {
    name: '슈퍼맨',
    description:
      '엎드린 자세에서 팔과 다리를 동시에 들어올리는 동작을 15회씩 3세트 진행하세요. 하부 등 근육을 강화합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=97kJcHgxJHo',
    part: 'BACK',
    duration: 8,
  },
  {
    name: 'T-BAR 로우',
    description:
      'T-바를 잡고 상체를 기울인 상태에서 등을 수축하며 당기는 동작을 10회씩 4세트 진행하세요.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=j3Igk5nyZE4',
    part: 'BACK',
    duration: 15,
  },
  // SHOULDER 추가 (5개 이상)
  {
    name: '프론트 레이즈',
    description:
      '덤벨을 앞으로 올렸다 내리는 동작을 12회씩 3세트 진행하세요. 전면 어깨 근육을 타겟합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=-t7fuZ0KhDA',
    part: 'SHOULDER',
    duration: 10,
  },
  {
    name: '리어 델트 플라이',
    description:
      '상체를 기울인 상태에서 팔을 옆으로 벌리는 동작을 12회씩 3세트 진행하세요. 후면 어깨 근육을 강화합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=rep-qVOkqgk',
    part: 'SHOULDER',
    duration: 10,
  },
  {
    name: '덤벨 숄더 프레스',
    description:
      '서서 또는 앉아서 덤벨을 어깨 높이에서 머리 위로 올리는 동작을 12회씩 3세트 진행하세요.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=qEwKCR5JCog',
    part: 'SHOULDER',
    duration: 12,
  },
  {
    name: '업라이트 로우',
    description:
      '바벨을 몸 앞에서 어깨 높이까지 올렸다 내리는 동작을 12회씩 3세트 진행하세요. 측면 어깨와 승모근을 자극합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=Ja1wz0zaXPY',
    part: 'SHOULDER',
    duration: 10,
  },
  // LOWER_BODY 추가 (5개 이상)
  {
    name: '불가리안 스플릿 스쿼트',
    description:
      '뒤 발을 높은 곳에 올리고 한 다리로 스쿼트하는 동작을 좌우 12회씩 3세트 진행하세요. 하체와 균형감 향상에 효과적입니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=2C-uNgKwPLE',
    part: 'LOWER_BODY',
    duration: 15,
  },
  {
    name: '레그 컬',
    description:
      '레그 컬 머신에 앉아 다리를 뒤로 구부리는 동작을 15회씩 3세트 진행하세요. 대퇴 이두근을 타겟합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=0tn5K9NlCfo',
    part: 'LOWER_BODY',
    duration: 10,
  },
  // BICEPS 추가 (5개 이상)
  {
    name: '해머 컬',
    description:
      '덤벨을 손바닥이 서로 마주보도록 잡고 구부리는 동작을 15회씩 3세트 진행하세요. 이두근과 전완근을 동시에 운동합니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=TwD-YGVP4Bk',
    part: 'BICEPS',
    duration: 10,
  },
  {
    name: '컨센트레이션 컬',
    description:
      '벤치에 앉아 한 팔을 무릎에 올리고 덤벨을 구부리는 동작을 좌우 15회씩 3세트 진행하세요. 이두근의 피크를 만듭니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    part: 'BICEPS',
    duration: 12,
  },
  {
    name: '인클라인 덤벨 컬',
    description:
      '경사진 벤치에 누워 덤벨을 구부리는 동작을 12회씩 3세트 진행하세요. 이두근의 신전을 극대화합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=soxrZlIlfUE',
    part: 'BICEPS',
    duration: 12,
  },
  {
    name: '바벨 컬',
    description:
      '서서 바벨을 잡고 구부리는 동작을 12회씩 4세트 진행하세요. 양팔을 동시에 운동하여 효율적입니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo',
    part: 'BICEPS',
    duration: 12,
  },
  {
    name: '케이블 컬',
    description:
      '케이블 머신을 사용해 커브 바를 잡고 구부리는 동작을 15회씩 3세트 진행하세요. 일정한 저항으로 근육을 자극합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=NFzTWp2qpiE',
    part: 'BICEPS',
    duration: 10,
  },
  // TRICEPS 추가 (5개 이상)
  {
    name: '오버헤드 익스텐션',
    description:
      '덤벨이나 바벨을 머리 위로 올리고 팔꿈치만 구부려 뒤로 내렸다 올리는 동작을 12회씩 3세트 진행하세요.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=-Vyt2QdsR7E',
    part: 'TRICEPS',
    duration: 12,
  },
  {
    name: '케이블 푸시다운',
    description:
      '케이블 머신의 로프를 잡고 팔꿈치를 고정한 채 아래로 내리는 동작을 15회씩 3세트 진행하세요.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=2-LAMcpzODU',
    part: 'TRICEPS',
    duration: 10,
  },
  {
    name: '클로즈 그립 푸시업',
    description:
      '손을 어깨너비보다 좁게 하고 푸시업을 하는 동작을 12회씩 3세트 진행하세요. 삼두근에 집중합니다.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=jH-w68wX1LE',
    part: 'TRICEPS',
    duration: 10,
  },
  {
    name: '벤치 딥스',
    description:
      '벤치에 손을 대고 발을 앞으로 뻗은 상태에서 몸을 내렸다 올리는 동작을 12회씩 3세트 진행하세요.',
    level: 'INTERMEDIATE',
    youtubeLink: 'https://www.youtube.com/watch?v=6kALZikXxLc',
    part: 'TRICEPS',
    duration: 10,
  },
  {
    name: '킥백',
    description:
      '한 손과 한 무릎을 벤치에 올리고 다른 손에 덤벨을 잡아 뒤로 뻗는 동작을 좌우 12회씩 3세트 진행하세요.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=_gsUck-7M74',
    part: 'TRICEPS',
    duration: 10,
  },
  // HOME_TRAINING 추가 (5개 이상)
  {
    name: '버드 독',
    description:
      '네발로 서서 반대편 팔과 다리를 동시에 들어올리는 동작을 좌우 12회씩 3세트 진행하세요. 코어와 균형감 향상에 효과적입니다.',
    level: 'BEGINNER',
    youtubeLink: 'https://www.youtube.com/watch?v=wiFNA3sqjBA',
    part: 'HOME_TRAINING',
    duration: 8,
  },
];

/**
 * 더미 운동 추천 데이터를 랜덤으로 선택하여 반환
 * @param count 반환할 개수 (기본값: 5)
 * @param part 특정 부위 필터 (선택사항)
 * @returns 랜덤으로 선택된 운동 추천 배열
 */
export function getRandomExerciseRecommendations(
  count: number = 5,
  part?: FallbackExercise['part']
): FallbackExercise[] {
  let pool = FALLBACK_EXERCISE_RECOMMENDATIONS;
  
  // 특정 부위로 필터링
  if (part) {
    pool = pool.filter(ex => ex.part === part);
  }
  
  // 랜덤으로 섞기
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  
  // 요청한 개수만큼 반환
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

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
    id: 'fallback_breakfast_1',
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
    id: 'fallback_lunch_1',
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
    id: 'fallback_dinner_1',
    name: '연어 구이와 단호박 샐러드',
    calory: 480,
    carbohydrate: 35,
    protein: 32,
    fat: 20,
    foodKind: 'DINNER',
    description:
      '오븐에 구운 연어와 단호박, 시금치를 곁들인 샐러드로 가벼우면서도 단백질을 충분히 섭취합니다.',
  },
  {
    id: 'fallback_breakfast_2',
    name: '아보카도 토스트',
    calory: 350,
    carbohydrate: 45,
    protein: 12,
    fat: 16,
    foodKind: 'BREAKFAST',
    description:
      '통곡물 토스트에 으깬 아보카도와 계란을 올린 건강한 아침식사로 오메가-3와 단백질을 섭취하세요.',
  },
  {
    id: 'fallback_breakfast_3',
    name: '오트밀 바나나 볼',
    calory: 380,
    carbohydrate: 62,
    protein: 15,
    fat: 8,
    foodKind: 'BREAKFAST',
    description:
      '오트밀에 바나나, 견과류, 꿀을 넣어 만든 영양 가득한 아침식사로 하루를 시작하세요.',
  },
  {
    id: 'fallback_breakfast_4',
    name: '계란 스크램블과 통곡물 빵',
    calory: 320,
    carbohydrate: 28,
    protein: 20,
    fat: 14,
    foodKind: 'BREAKFAST',
    description:
      '부드러운 스크램블 에그와 통곡물 토스트, 신선한 채소를 곁들인 클래식한 아침식사입니다.',
  },
  {
    id: 'fallback_breakfast_5',
    name: '그릭요거트 파르페',
    calory: 340,
    carbohydrate: 48,
    protein: 18,
    fat: 10,
    foodKind: 'BREAKFAST',
    description:
      '그릭요거트에 그랜올라, 딸기, 블루베리를 층층이 쌓아 만든 비주얼 좋은 아침식사입니다.',
  },
  {
    id: 'fallback_lunch_2',
    name: '연어 샐러드 보울',
    calory: 520,
    carbohydrate: 42,
    protein: 35,
    fat: 22,
    foodKind: 'LUNCH',
    description:
      '훈제 연어와 퀴노아, 아보카도, 체리 토마토를 올린 영양 가득한 샐러드 보울입니다.',
  },
  {
    id: 'fallback_lunch_3',
    name: '치킨 샐러드 랩',
    calory: 480,
    carbohydrate: 55,
    protein: 32,
    fat: 16,
    foodKind: 'LUNCH',
    description:
      '구운 닭가슴살과 신선한 채소를 통밀 토르티야에 감싼 가볍고 건강한 점심식사입니다.',
  },
  {
    id: 'fallback_lunch_4',
    name: '미역국과 현미밥',
    calory: 290,
    carbohydrate: 52,
    protein: 12,
    fat: 4,
    foodKind: 'LUNCH',
    description:
      '국물이 시원한 미역국과 현미밥, 다양한 나물 반찬으로 구성된 한식 점심식사입니다.',
  },
  {
    id: 'fallback_lunch_5',
    name: '새우 볶음밥',
    calory: 540,
    carbohydrate: 72,
    protein: 28,
    fat: 14,
    foodKind: 'LUNCH',
    description:
      '통통한 새우와 야채를 넣어 만든 볶음밥으로 탄수화물과 단백질을 한 번에 섭취하세요.',
  },
  {
    id: 'fallback_dinner_2',
    name: '치킨 스테이크와 로스티드 야채',
    calory: 520,
    carbohydrate: 38,
    protein: 45,
    fat: 18,
    foodKind: 'DINNER',
    description:
      '구운 닭가슴살 스테이크와 오븐에 구운 당근, 브로콜리를 곁들인 든든한 저녁식사입니다.',
  },
  {
    id: 'fallback_dinner_3',
    name: '두부 덮밥',
    calory: 460,
    carbohydrate: 58,
    protein: 25,
    fat: 12,
    foodKind: 'DINNER',
    description:
      '구운 두부와 달걀, 야채를 올린 덮밥으로 식물성 단백질을 충분히 섭취할 수 있습니다.',
  },
  {
    id: 'fallback_dinner_4',
    name: '굴비 정식',
    calory: 490,
    carbohydrate: 48,
    protein: 35,
    fat: 16,
    foodKind: 'DINNER',
    description:
      '구운 굴비와 현미밥, 미역국, 나물 반찬으로 구성된 영양 균형 잡힌 저녁식사입니다.',
  },
  {
    id: 'fallback_dinner_5',
    name: '스파이시 치킨 샐러드',
    calory: 450,
    carbohydrate: 32,
    protein: 38,
    fat: 18,
    foodKind: 'DINNER',
    description:
      '매콤한 양념의 구운 닭가슴살과 신선한 채소, 아보카도를 올린 가벼운 저녁식사입니다.',
  },
];

/**
 * 더미 음식 추천 데이터를 랜덤으로 선택하여 반환
 * @param count 반환할 개수 (기본값: 3)
 * @param foodKind 특정 식사 타입 필터 (선택사항)
 * @returns 랜덤으로 선택된 음식 추천 배열
 */
export function getRandomFoodRecommendations(
  count: number = 3,
  foodKind?: FallbackFoodRecommendation['foodKind']
): FallbackFoodRecommendation[] {
  let pool = FALLBACK_FOOD_RECOMMENDATIONS;
  
  // 특정 식사 타입으로 필터링
  if (foodKind) {
    pool = pool.filter(food => food.foodKind === foodKind);
  }
  
  // 랜덤으로 섞기
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  
  // 요청한 개수만큼 반환
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

