// 공통 타입 정의

export interface Food {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  fiber?: number;
  sodium?: number;
  calcium?: number;
  iron?: number;
  vitaminC?: number;
  vitaminD?: number;
  omega3?: number;
}

export interface FoodEntry {
  id: string;
  food: Food;
  quantity: number;
  time: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'flexibility';
  caloriesPerMinute: number;
  description?: string;
}

export interface WorkoutEntry {
  id: string;
  exercise: Exercise;
  duration: number;
  intensity?: 'low' | 'medium' | 'high';
  time: string;
}

export interface RecommendedExercise {
  id: string;
  name: string;
  targetMuscle: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  youtubeUrl: string;
  tips: string[];
}

export interface RankingUser {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  unit: string;
  rank: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  participants: number;
  reward: string;
  progress: number;
  isJoined: boolean;
  type: 'weekly' | 'monthly' | 'daily';
}

export interface Post {
  id: string;
  author: {
    name: string;
    avatar?: string;
    level: string;
  };
  content: string;
  image?: string;
  category: 'workout' | 'diet' | 'weight-loss';
  hashtags: string[];
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
}

export interface UserInfo {
  name: string;
  email: string;
  joinDate: string;
  level: string;
  totalWorkouts: number;
  totalDays: number;
  achievements: number;
}

export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  exercise: number;
}

export interface CurrentNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  exercise: number;
}

export interface InBodyData {
  weight: number;
  muscleMass: number;
  bodyFatPercentage: number;
  bmi: number;
  lastUpdated: string;
  isConnected: boolean;
}
