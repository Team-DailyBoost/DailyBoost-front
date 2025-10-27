import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Search, Plus, Trash2, Clock, ChefHat, Lightbulb, Utensils, Settings, Target, Clipboard, TrendingUp, Heart, Star, BookOpen } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

interface Food {
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

interface FoodEntry {
  id: string;
  food: Food;
  quantity: number;
  time: string;
}

interface MealPlan {
  breakfast: Food;
  lunch: Food;
  dinner: Food;
  totalCalories: number;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cookingTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
  instructions: string[];
}

interface DietSettings {
  type: 'maintenance' | 'intermittent' | 'bulk' | 'cut' | 'keto' | 'mediterranean' | 'dash' | 'highprotein';
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  initialized: boolean;
}

interface WeeklyFoodEntry {
  date: string;
  foods: FoodEntry[];
  totalCalories: number;
}

interface FavoriteFood {
  food: Food;
  count: number;
}

interface FoodCombo {
  id: string;
  name: string;
  foods: Food[];
  count: number;
}

export function FoodLogger() {
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [todaysFoods, setTodaysFoods] = useState<FoodEntry[]>([]);
  const [weeklyFoods, setWeeklyFoods] = useState<WeeklyFoodEntry[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [favoriteFoods, setFavoriteFoods] = useState<FavoriteFood[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [foodCombos, setFoodCombos] = useState<FoodCombo[]>([]);
  const [quickAccessMode, setQuickAccessMode] = useState<'search' | 'recent' | 'favorites'>('search');
  const [dietSettings, setDietSettings] = useState<DietSettings>(() => {
    const saved = localStorage.getItem('dietSettings');
    return saved ? JSON.parse(saved) : {
      type: 'maintenance',
      calorieGoal: 2000,
      proteinGoal: 150,
      carbGoal: 250,
      fatGoal: 67,
      initialized: true
    };
  });

  useEffect(() => {
    const savedFoods = localStorage.getItem('todaysFoods');
    if (savedFoods) {
      setTodaysFoods(JSON.parse(savedFoods));
    }
    const savedWeeklyFoods = localStorage.getItem('weeklyFoods');
    if (savedWeeklyFoods) {
      setWeeklyFoods(JSON.parse(savedWeeklyFoods));
    }
    
    // Load quick access data
    const savedFavorites = localStorage.getItem('favoriteFoods');
    const savedRecent = localStorage.getItem('recentFoods');
    const savedCombos = localStorage.getItem('foodCombos');
    
    if (savedFavorites) setFavoriteFoods(JSON.parse(savedFavorites));
    if (savedRecent) setRecentFoods(JSON.parse(savedRecent));
    if (savedCombos) setFoodCombos(JSON.parse(savedCombos));
  }, []);

  useEffect(() => {
    localStorage.setItem('dietSettings', JSON.stringify(dietSettings));
  }, [dietSettings]);

  useEffect(() => {
    localStorage.setItem('todaysFoods', JSON.stringify(todaysFoods));
    
    // Update weekly data when daily foods change
    const today = new Date().toISOString().split('T')[0];
    const totalCalories = todaysFoods.reduce((sum, entry) => sum + (entry.food.calories * entry.quantity), 0);
    
    setWeeklyFoods(prev => {
      const existing = prev.filter(entry => entry.date !== today);
      if (todaysFoods.length > 0) {
        return [...existing, { date: today, foods: todaysFoods, totalCalories }];
      }
      return existing;
    });
  }, [todaysFoods]);

  useEffect(() => {
    localStorage.setItem('weeklyFoods', JSON.stringify(weeklyFoods));
  }, [weeklyFoods]);

  // Save quick access data to localStorage
  useEffect(() => {
    localStorage.setItem('favoriteFoods', JSON.stringify(favoriteFoods));
  }, [favoriteFoods]);

  useEffect(() => {
    localStorage.setItem('recentFoods', JSON.stringify(recentFoods));
  }, [recentFoods]);

  useEffect(() => {
    localStorage.setItem('foodCombos', JSON.stringify(foodCombos));
  }, [foodCombos]);

  // Mock food database with enhanced nutrients
  const foodDatabase: Food[] = [
    { id: 'rice', name: '백미밥', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: '1공기 (210g)', fiber: 0.4, sodium: 1, calcium: 3, iron: 0.8 },
    { id: 'chicken', name: '닭가슴살', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g', fiber: 0, sodium: 74, calcium: 15, iron: 1.04 },
    { id: 'egg', name: '계란', calories: 70, protein: 6, carbs: 0.6, fat: 5, serving: '1개 (50g)', fiber: 0, sodium: 62, calcium: 25, iron: 0.9, vitaminD: 1.1 },
    { id: 'banana', name: '바나나', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: '1개 (100g)', fiber: 2.6, sodium: 1, calcium: 5, vitaminC: 8.7 },
    { id: 'salmon', name: '연어', calories: 208, protein: 22, carbs: 0, fat: 13, serving: '100g', fiber: 0, sodium: 59, calcium: 12, iron: 0.8, omega3: 2.3, vitaminD: 11 },
    { id: 'broccoli', name: '브로콜리', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: '100g', fiber: 2.6, sodium: 33, calcium: 47, iron: 0.73, vitaminC: 89.2 },
    { id: 'sweet_potato', name: '고구마', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: '1개 (100g)', fiber: 3, sodium: 6, calcium: 30, iron: 0.61, vitaminC: 2.4 },
    { id: 'oatmeal', name: '오트밀', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, serving: '30g', fiber: 1.7, sodium: 2, calcium: 9, iron: 0.7 },
    { id: 'greek_yogurt', name: '그릭요거트', calories: 97, protein: 9, carbs: 6, fat: 5, serving: '100g', fiber: 0, sodium: 35, calcium: 115, iron: 0.04 },
    { id: 'avocado', name: '아보카도', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '1개 (100g)', fiber: 6.7, sodium: 7, calcium: 12, iron: 0.55, vitaminC: 10 },
    { id: 'spinach', name: '시금치', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: '100g', fiber: 2.2, sodium: 79, calcium: 99, iron: 2.71, vitaminC: 28.1 },
    { id: 'almonds', name: '아몬드', calories: 579, protein: 21.2, carbs: 21.6, fat: 49.9, serving: '100g', fiber: 12.5, sodium: 1, calcium: 269, iron: 3.71 },
    { id: 'tuna', name: '참치', calories: 184, protein: 25.4, carbs: 0, fat: 8.1, serving: '100g', fiber: 0, sodium: 247, calcium: 8, iron: 1.02, omega3: 1.3 }
  ];

  // Generate meal plan based on diet settings
  const generateMealPlan = (): MealPlan => {
    const { type, calorieGoal } = dietSettings;
    
    const mealPlans = {
      maintenance: {
        breakfast: {
          id: 'breakfast_balanced',
          name: '오트밥 + 바나나 + 그릭요거트',
          calories: Math.round(calorieGoal * 0.25),
          protein: Math.round(calorieGoal * 0.25 * 0.15 / 4),
          carbs: Math.round(calorieGoal * 0.25 * 0.55 / 4),
          fat: Math.round(calorieGoal * 0.25 * 0.30 / 9),
          serving: '1인분'
        },
        lunch: {
          id: 'lunch_balanced',
          name: '닭가슴살 볶음밥 + 브로콜리',
          calories: Math.round(calorieGoal * 0.40),
          protein: Math.round(calorieGoal * 0.40 * 0.25 / 4),
          carbs: Math.round(calorieGoal * 0.40 * 0.50 / 4),
          fat: Math.round(calorieGoal * 0.40 * 0.25 / 9),
          serving: '1인분'
        },
        dinner: {
          id: 'dinner_balanced',
          name: '연어구이 + 현미밥 + 샐러드',
          calories: Math.round(calorieGoal * 0.35),
          protein: Math.round(calorieGoal * 0.35 * 0.30 / 4),
          carbs: Math.round(calorieGoal * 0.35 * 0.45 / 4),
          fat: Math.round(calorieGoal * 0.35 * 0.25 / 9),
          serving: '1인분'
        }
      },
      cut: {
        breakfast: {
          id: 'breakfast_cut',
          name: '계란 스크램블 + 아보카도',
          calories: Math.round(calorieGoal * 0.30),
          protein: Math.round(calorieGoal * 0.30 * 0.35 / 4),
          carbs: Math.round(calorieGoal * 0.30 * 0.25 / 4),
          fat: Math.round(calorieGoal * 0.30 * 0.40 / 9),
          serving: '1인분'
        },
        lunch: {
          id: 'lunch_cut',
          name: '닭가슴살 샐러드 + 현미밥(소량)',
          calories: Math.round(calorieGoal * 0.40),
          protein: Math.round(calorieGoal * 0.40 * 0.40 / 4),
          carbs: Math.round(calorieGoal * 0.40 * 0.30 / 4),
          fat: Math.round(calorieGoal * 0.40 * 0.30 / 9),
          serving: '1인분'
        },
        dinner: {
          id: 'dinner_cut',
          name: '연어구이 + 브로콜리 + 시금치',
          calories: Math.round(calorieGoal * 0.30),
          protein: Math.round(calorieGoal * 0.30 * 0.45 / 4),
          carbs: Math.round(calorieGoal * 0.30 * 0.20 / 4),
          fat: Math.round(calorieGoal * 0.30 * 0.35 / 9),
          serving: '1인분'
        }
      },
      bulk: {
        breakfast: {
          id: 'breakfast_bulk',
          name: '오트밀 + 단백질파우더 + 견과류',
          calories: Math.round(calorieGoal * 0.25),
          protein: Math.round(calorieGoal * 0.25 * 0.25 / 4),
          carbs: Math.round(calorieGoal * 0.25 * 0.50 / 4),
          fat: Math.round(calorieGoal * 0.25 * 0.25 / 9),
          serving: '1인분'
        },
        lunch: {
          id: 'lunch_bulk',
          name: '닭가슴살 덮밥 + 고구마',
          calories: Math.round(calorieGoal * 0.35),
          protein: Math.round(calorieGoal * 0.35 * 0.30 / 4),
          carbs: Math.round(calorieGoal * 0.35 * 0.55 / 4),
          fat: Math.round(calorieGoal * 0.35 * 0.15 / 9),
          serving: '1인분'
        },
        dinner: {
          id: 'dinner_bulk',
          name: '소고기 + 현미밥 + 아보카도',
          calories: Math.round(calorieGoal * 0.40),
          protein: Math.round(calorieGoal * 0.40 * 0.25 / 4),
          carbs: Math.round(calorieGoal * 0.40 * 0.45 / 4),
          fat: Math.round(calorieGoal * 0.40 * 0.30 / 9),
          serving: '1인분'
        }
      },
      keto: {
        breakfast: {
          id: 'breakfast_keto',
          name: '계란 + 아보카도 + 베이컨',
          calories: Math.round(calorieGoal * 0.30),
          protein: Math.round(calorieGoal * 0.30 * 0.25 / 4),
          carbs: Math.round(calorieGoal * 0.30 * 0.05 / 4),
          fat: Math.round(calorieGoal * 0.30 * 0.70 / 9),
          serving: '1인분'
        },
        lunch: {
          id: 'lunch_keto',
          name: '연어 + 아보카도 샐러드',
          calories: Math.round(calorieGoal * 0.35),
          protein: Math.round(calorieGoal * 0.35 * 0.30 / 4),
          carbs: Math.round(calorieGoal * 0.35 * 0.05 / 4),
          fat: Math.round(calorieGoal * 0.35 * 0.65 / 9),
          serving: '1인분'
        },
        dinner: {
          id: 'dinner_keto',
          name: '소고기 스테이크 + 브로콜리',
          calories: Math.round(calorieGoal * 0.35),
          protein: Math.round(calorieGoal * 0.35 * 0.35 / 4),
          carbs: Math.round(calorieGoal * 0.35 * 0.05 / 4),
          fat: Math.round(calorieGoal * 0.35 * 0.60 / 9),
          serving: '1인분'
        }
      },
      highprotein: {
        breakfast: {
          id: 'breakfast_protein',
          name: '단백질 스무디 + 계란',
          calories: Math.round(calorieGoal * 0.25),
          protein: Math.round(calorieGoal * 0.25 * 0.40 / 4),
          carbs: Math.round(calorieGoal * 0.25 * 0.35 / 4),
          fat: Math.round(calorieGoal * 0.25 * 0.25 / 9),
          serving: '1인분'
        },
        lunch: {
          id: 'lunch_protein',
          name: '닭가슴살 두 배 + 현미밥',
          calories: Math.round(calorieGoal * 0.40),
          protein: Math.round(calorieGoal * 0.40 * 0.45 / 4),
          carbs: Math.round(calorieGoal * 0.40 * 0.40 / 4),
          fat: Math.round(calorieGoal * 0.40 * 0.15 / 9),
          serving: '1인분'
        },
        dinner: {
          id: 'dinner_protein',
          name: '연어 + 두부 + 채소',
          calories: Math.round(calorieGoal * 0.35),
          protein: Math.round(calorieGoal * 0.35 * 0.50 / 4),
          carbs: Math.round(calorieGoal * 0.35 * 0.25 / 4),
          fat: Math.round(calorieGoal * 0.35 * 0.25 / 9),
          serving: '1인분'
        }
      }
    };
    
    const selectedPlan = mealPlans[type] || mealPlans.maintenance;
    
    return {
      breakfast: selectedPlan.breakfast,
      lunch: selectedPlan.lunch,
      dinner: selectedPlan.dinner,
      totalCalories: selectedPlan.breakfast.calories + selectedPlan.lunch.calories + selectedPlan.dinner.calories
    };
  };

  const todaysMealPlan = generateMealPlan();

  // Initialize diet settings
  const initializeDietSettings = (type: string) => {
    const baseCalories = 2000;
    let settings: Partial<DietSettings> = { type: type as any, initialized: true };

    switch (type) {
      case 'intermittent':
        settings = { ...settings, calorieGoal: baseCalories * 0.8, proteinGoal: 120, carbGoal: 150, fatGoal: 60 };
        break;
      case 'bulk':
        settings = { ...settings, calorieGoal: baseCalories * 1.2, proteinGoal: 180, carbGoal: 300, fatGoal: 80 };
        break;
      case 'cut':
        settings = { ...settings, calorieGoal: baseCalories * 0.75, proteinGoal: 140, carbGoal: 120, fatGoal: 50 };
        break;
      case 'keto':
        settings = { ...settings, calorieGoal: baseCalories, proteinGoal: 125, carbGoal: 25, fatGoal: 155 };
        break;
      case 'mediterranean':
        settings = { ...settings, calorieGoal: baseCalories, proteinGoal: 100, carbGoal: 225, fatGoal: 78 };
        break;
      case 'dash':
        settings = { ...settings, calorieGoal: baseCalories, proteinGoal: 125, carbGoal: 250, fatGoal: 56 };
        break;
      case 'highprotein':
        settings = { ...settings, calorieGoal: baseCalories, proteinGoal: 200, carbGoal: 150, fatGoal: 67 };
        break;
      default:
        settings = { ...settings, calorieGoal: baseCalories, proteinGoal: 150, carbGoal: 250, fatGoal: 67 };
    }

    setDietSettings(prev => ({ ...prev, ...settings }));
    setShowInitialSetup(false);
  };

  // Copy to clipboard function
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('클립보드에 복사되었습니다!');
    });
  };

  const getRecipeSuggestions = (ingredientList: string): Recipe[] => {
    const ingredients = ingredientList.toLowerCase().split(',').map(i => i.trim());
    
    const recipes: Recipe[] = [
      {
        id: 'chicken_rice_bowl',
        name: '닭가슴살 덮밥',
        ingredients: ['닭가슴살', '현미밥', '브로콜리', '당근', '간장'],
        calories: 380,
        protein: 35,
        carbs: 45,
        fat: 8,
        cookingTime: '20분',
        difficulty: 'easy',
        instructions: [
          '닭가슴살을 한입 크기로 자르기',
          '브로콜리와 당근을 데치기',
          '팬에 닭가슴살을 볶기',
          '간장으로 간을 맞추기',
          '현미밥 위에 올려 완성'
        ]
      },
      {
        id: 'egg_avocado_toast',
        name: '계란 아보카도 토스트',
        ingredients: ['계란', '아보카도', '통밀빵', '토마토', '소금', '후추'],
        calories: 320,
        protein: 18,
        carbs: 25,
        fat: 18,
        cookingTime: '10분',
        difficulty: 'easy',
        instructions: [
          '통밀빵을 토스트하기',
          '계란을 삶거나 프라이하기',
          '아보카도를 으깨서 빵에 발르기',
          '계란과 토마토 올리기',
          '소금, 후추로 간하기'
        ]
      },
      {
        id: 'salmon_salad',
        name: '연어 샐러드',
        ingredients: ['연어', '상추', '토마토', '오이', '올리브오일', '레몬'],
        calories: 280,
        protein: 25,
        carbs: 8,
        fat: 18,
        cookingTime: '15분',
        difficulty: 'easy',
        instructions: [
          '연어를 팬에 구워주기',
          '상추, 토마토, 오이 씻어 자르기',
          '올리브오일과 레몬으로 드레싱 만들기',
          '야채 위에 연어 올리기',
          '드레싱 뿌려 완성'
        ]
      }
    ];

    // Filter recipes based on available ingredients
    return recipes.filter(recipe => 
      recipe.ingredients.some(ingredient => 
        ingredients.some(userIngredient => 
          ingredient.toLowerCase().includes(userIngredient) || 
          userIngredient.includes(ingredient.toLowerCase())
        )
      )
    );
  };

  const recipeSuggestions = ingredients ? getRecipeSuggestions(ingredients) : [];

  const filteredFoods = foodDatabase.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFood = (food: Food) => {
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      food,
      quantity: 1,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setTodaysFoods(prev => [...prev, newEntry]);

    // Update recent foods
    setRecentFoods(prev => {
      const filtered = prev.filter(f => f.id !== food.id);
      const newRecent = [food, ...filtered].slice(0, 10);
      return newRecent;
    });

    // Update favorite foods count
    setFavoriteFoods(prev => {
      const existing = prev.find(f => f.food.id === food.id);
      let newFavorites;
      if (existing) {
        newFavorites = prev.map(f => 
          f.food.id === food.id ? { ...f, count: f.count + 1 } : f
        );
      } else {
        newFavorites = [...prev, { food, count: 1 }];
      }
      newFavorites.sort((a, b) => b.count - a.count);
      return newFavorites.slice(0, 20);
    });
  };

  const addMealPlan = (meal: Food) => {
    // 추천 식단에서 추가할 때는 즐겨찾기 업데이트 없이 기록만 추가
    const newEntry: FoodEntry = {
      id: Date.now().toString(),
      food: meal,
      quantity: 1,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    };
    setTodaysFoods(prev => [...prev, newEntry]);

    // Update recent foods only
    setRecentFoods(prev => {
      const filtered = prev.filter(f => f.id !== meal.id);
      const newRecent = [meal, ...filtered].slice(0, 10);
      return newRecent;
    });
  };

  const removeFood = (id: string) => {
    setTodaysFoods(prev => prev.filter(entry => entry.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    setTodaysFoods(prev => 
      prev.map(entry => 
        entry.id === id ? { ...entry, quantity: Math.max(0.1, quantity) } : entry
      )
    );
  };

  const saveAsCombo = () => {
    if (todaysFoods.length === 0) return;
    
    const comboName = prompt('조합 이름을 입력하세요:');
    if (!comboName) return;
    
    const newCombo: FoodCombo = {
      id: Date.now().toString(),
      name: comboName,
      foods: todaysFoods.map(entry => entry.food),
      count: 1
    };
    
    setFoodCombos(prev => {
      const newCombos = [newCombo, ...prev].slice(0, 10);
      return newCombos;
    });
    
    alert('조합이 저장되었습니다!');
  };

  const addCombo = (combo: FoodCombo) => {
    combo.foods.forEach(food => addFood(food));
    
    // Update combo usage count
    setFoodCombos(prev => {
      const updated = prev.map(c => 
        c.id === combo.id ? { ...c, count: c.count + 1 } : c
      );
      updated.sort((a, b) => b.count - a.count);
      return updated;
    });
  };

  const toggleFavorite = (food: Food) => {
    setFavoriteFoods(prev => {
      const existing = prev.find(f => f.food.id === food.id);
      let newFavorites;
      if (existing) {
        // Remove from favorites
        newFavorites = prev.filter(f => f.food.id !== food.id);
      } else {
        // Add to favorites
        newFavorites = [...prev, { food, count: 1 }];
        newFavorites.sort((a, b) => b.count - a.count);
      }
      return newFavorites;
    });
  };

  const isFavorite = (foodId: string) => {
    return favoriteFoods.some(f => f.food.id === foodId);
  };

  const totalCalories = todaysFoods.reduce((sum, entry) => 
    sum + (entry.food.calories * entry.quantity), 0
  );

  // Generate weekly data for the last 7 days
  const getWeeklyData = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('ko-KR', { weekday: 'short' });
      
      const dayData = weeklyFoods.find(entry => entry.date === dateString);
      days.push({
        date: dateString,
        dayName,
        calories: dayData?.totalCalories || 0,
        foods: dayData?.foods || []
      });
    }
    
    return days;
  };

  const weeklyData = getWeeklyData();

  const totalProtein = todaysFoods.reduce((sum, entry) => 
    sum + (entry.food.protein * entry.quantity), 0
  );

  const totalCarbs = todaysFoods.reduce((sum, entry) => 
    sum + (entry.food.carbs * entry.quantity), 0
  );

  const totalFat = todaysFoods.reduce((sum, entry) => 
    sum + (entry.food.fat * entry.quantity), 0
  );

  const calorieProgress = (totalCalories / dietSettings.calorieGoal) * 100;
  const proteinProgress = (totalProtein / dietSettings.proteinGoal) * 100;
  const carbProgress = (totalCarbs / dietSettings.carbGoal) * 100;
  const fatProgress = (totalFat / dietSettings.fatGoal) * 100;

  const NutritionChart = ({ protein, carbs, fat }: { protein: number, carbs: number, fat: number }) => {
    const data = [
      { name: '단백질', value: protein * 4, color: '#22c55e' },
      { name: '탄수화물', value: carbs * 4, color: '#3b82f6' },
      { name: '지방', value: fat * 9, color: '#f59e0b' }
    ];

    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={12}
                outerRadius={24}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-1">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-muted-foreground">{item.name}</span>
              <span className="font-medium">{item.name === '단백질' ? protein : item.name === '탄수화물' ? carbs : fat}g</span>
              <span className="text-muted-foreground">({Math.round((item.value / total) * 100)}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MealCard = ({ meal, mealType, time }: { meal: Food, mealType: string, time: string }) => (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{mealType}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(meal);
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Star className={`h-4 w-4 ${isFavorite(meal.id) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                </Button>
              </div>
              <h4 className="font-medium">{meal.name}</h4>
              <p className="text-sm text-muted-foreground">{time}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">{meal.calories}kcal</div>
              <div className="text-xs text-muted-foreground">{meal.serving}</div>
            </div>
          </div>
          
          <NutritionChart protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />
          
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => addMealPlan(meal)}
          >
            <Plus className="h-4 w-4 mr-1" />
            추가하기
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const RecipeCard = ({ recipe }: { recipe: Recipe }) => (
    <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{recipe.name}</h4>
            <div className="flex gap-2">
              <Badge variant={recipe.difficulty === 'easy' ? 'secondary' : 
                            recipe.difficulty === 'medium' ? 'default' : 'destructive'}>
                {recipe.difficulty === 'easy' ? '쉬움' :
                 recipe.difficulty === 'medium' ? '보통' : '어려움'}
              </Badge>
              <Badge variant="outline">{recipe.cookingTime}</Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{recipe.calories}</div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>
            <NutritionChart protein={recipe.protein} carbs={recipe.carbs} fat={recipe.fat} />
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">필요한 재료</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.map((ingredient, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">조리법</span>
            </div>
            <ol className="text-xs text-muted-foreground space-y-1">
              {recipe.instructions.slice(0, 3).map((step, index) => (
                <li key={index}>{index + 1}. {step}</li>
              ))}
              {recipe.instructions.length > 3 && (
                <li className="text-primary">...더보기</li>
              )}
            </ol>
          </div>
          
          <Button 
            size="sm" 
            className="w-full"
            onClick={() => addFood({
              id: recipe.id,
              name: recipe.name,
              calories: recipe.calories,
              protein: recipe.protein,
              carbs: recipe.carbs,
              fat: recipe.fat,
              serving: '1인분'
            })}
          >
            <Plus className="h-4 w-4 mr-1" />
            식단에 추가
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Nutrition feedback function
  const getNutritionFeedback = () => {
    const feedbacks = [];
    
    if (proteinProgress < 70) {
      feedbacks.push("💪 단백질 섭취가 부족해요! 닭가슴살, 두부, 계란을 추가해보세요.");
    }
    
    if (carbProgress > 120) {
      feedbacks.push("🍚 탄수화물 섭취가 많아요. 현미나 고구마 같은 복합탄수화물을 선택해보세요.");
    }
    
    if (fatProgress < 50) {
      feedbacks.push("🥑 좋은 지방 섭취를 늘려보세요. 아보카도, 견과류, 올리브오일을 추천해요.");
    }
    
    if (calorieProgress < 80) {
      feedbacks.push("🔥 칼로리 섭취가 부족해요. 균형잡힌 식사를 더 드세요!");
    }
    
    if (calorieProgress > 110) {
      feedbacks.push("⚠️ 목표 칼로를 초과했어요. 내일은 조금 더 주의해서 드세요.");
    }
    
    if (feedbacks.length === 0) {
      feedbacks.push("✨ 완벽한 균형잡힌 식단이에요! 계속 유지하세요!");
    }
    
    return feedbacks[0]; // Return first feedback
  };

  const CalorieTracker = () => {
    const gaugeData = [
      { name: '칼로리', value: calorieProgress, color: '#3b82f6' },
      { name: '단백질', value: proteinProgress, color: '#22c55e' },
      { name: '탄수화물', value: carbProgress, color: '#f59e0b' },
      { name: '지방', value: fatProgress, color: '#f97316' }
    ];

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              칼로리 추적
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(`오늘 섭취 칼로리: ${Math.round(totalCalories)}kcal / 목표: ${dietSettings.calorieGoal}kcal`)}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {Math.round(totalCalories)}<span className="text-lg text-muted-foreground">/{dietSettings.calorieGoal}</span>
            </div>
            <div className="text-sm text-muted-foreground">kcal</div>
          </div>
          
          {/* Circular Progress Charts */}
          <div className="grid grid-cols-2 gap-4">
            {gaugeData.map((item, index) => (
              <div key={item.name} className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      width={80}
                      height={80}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="90%"
                      startAngle={90}
                      endAngle={-270}
                      data={[item]}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={10}
                        fill={item.color}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium">
                      {Math.round(
                        item.name === '칼로리' ? calorieProgress :
                        item.name === '단백질' ? proteinProgress :
                        item.name === '탄수화물' ? carbProgress :
                        fatProgress
                      )}%
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">{item.name}</div>
                <div className="text-xs font-medium">
                  {item.name === '칼로리' ? `${Math.round(totalCalories)}/${dietSettings.calorieGoal}kcal` :
                   item.name === '단백질' ? `${Math.round(totalProtein)}/${dietSettings.proteinGoal}g` :
                   item.name === '탄수화물' ? `${Math.round(totalCarbs)}/${dietSettings.carbGoal}g` :
                   `${Math.round(totalFat)}/${dietSettings.fatGoal}g`}
                </div>
              </div>
            ))}
          </div>

          {/* Feedback Alert */}
          <Alert>
            <Heart className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {getNutritionFeedback()}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold">식단 🍽️</h1>
        <p className="text-muted-foreground">오늘의 식단을 기록하고 추천받으세요</p>
      </div>

      <Tabs defaultValue="logger" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logger">기록</TabsTrigger>
          <TabsTrigger value="tracker">추적</TabsTrigger>
          <TabsTrigger value="plans">식단추천</TabsTrigger>
          <TabsTrigger value="ai-recipe">AI레시피</TabsTrigger>
        </TabsList>

        <TabsContent value="logger" className="space-y-4">
          {/* Unified Food Log */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  식단 기록
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('daily')}
                  >
                    일일
                  </Button>
                  <Button
                    variant={viewMode === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('weekly')}
                  >
                    주간
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {viewMode === 'daily' ? (
                <>
                  {/* Daily Summary */}
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-3xl font-bold text-primary">{Math.round(totalCalories)}</div>
                    <div className="text-sm text-muted-foreground">오늘 섭취한 총 칼로리</div>
                  </div>
                  
                  {/* Today's Food Entries */}
                  <div className="space-y-3">
                    <h4 className="font-medium">오늘 먹은 음식</h4>
                    <ScrollArea className="h-64">
                      <div className="space-y-3 pr-2">
                        {todaysFoods.map(entry => (
                          <div key={entry.id} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{entry.food.name}</div>
                                <div className="text-sm text-muted-foreground">{entry.time}</div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {entry.food.serving} × {entry.quantity}
                              </div>
                              <div className="text-sm font-medium text-primary">
                                {Math.round(entry.food.calories * entry.quantity)}kcal
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={entry.quantity}
                                onChange={(e) => updateQuantity(entry.id, parseFloat(e.target.value) || 0.1)}
                                className="w-16 h-8 text-center"
                                min="0.1"
                                step="0.1"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFood(entry.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        {todaysFoods.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            아직 기록된 음식이 없습니다<br />
                            아래에서 음식을 검색해서 추가해보세요
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              ) : (
                <>
                  {/* Weekly Summary */}
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(weeklyData.reduce((sum, day) => sum + day.calories, 0) / 7)}
                    </div>
                    <div className="text-sm text-muted-foreground">일평균 섭취 칼로리</div>
                  </div>
                  
                  {/* Weekly Data */}
                  <div className="space-y-3">
                    <h4 className="font-medium">주간 식단 기록</h4>
                    <div className="space-y-2">
                      {weeklyData.map((day, index) => (
                        <div key={day.date} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{day.dayName}</span>
                            <span className="text-xs text-muted-foreground">{day.date}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-primary">
                              {Math.round(day.calories)}kcal
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {day.foods.length}개 음식
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Food Search - Only show in daily mode */}
          {viewMode === 'daily' && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                음식 검색 & 추가
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Quick Access Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={quickAccessMode === 'search' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickAccessMode('search')}
                >
                  <Search className="h-4 w-4 mr-1" />
                  검색
                </Button>
                <Button
                  variant={quickAccessMode === 'recent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickAccessMode('recent')}
                >
                  <Clock className="h-4 w-4 mr-1" />
                  최근 ({recentFoods.length})
                </Button>
                <Button
                  variant={quickAccessMode === 'favorites' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setQuickAccessMode('favorites')}
                >
                  <Star className="h-4 w-4 mr-1" />
                  즐겨찾기 ({favoriteFoods.length})
                </Button>
              </div>

              {quickAccessMode === 'search' && (
                <Input
                  placeholder="음식 이름을 검색하세요..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              )}
              
              {/* Search Results */}
              {quickAccessMode === 'search' && searchQuery && (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {filteredFoods.map(food => (
                      <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">{food.serving}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{food.calories}kcal</Badge>
                            <Badge variant="outline">P{food.protein}g</Badge>
                            <Badge variant="outline">C{food.carbs}g</Badge>
                            <Badge variant="outline">F{food.fat}g</Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleFavorite(food)}
                          >
                            <Heart className={`h-4 w-4 ${isFavorite(food.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => addFood(food)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredFoods.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Recent Foods */}
              {quickAccessMode === 'recent' && (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {recentFoods.map(food => (
                      <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{food.name}</div>
                          <div className="text-sm text-muted-foreground">{food.serving}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{food.calories}kcal</Badge>
                            <Badge variant="outline">P{food.protein}g</Badge>
                            <Badge variant="outline">C{food.carbs}g</Badge>
                            <Badge variant="outline">F{food.fat}g</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addFood(food)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {recentFoods.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        최근 먹은 음식이 없습니다
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Favorite Foods */}
              {quickAccessMode === 'favorites' && (
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {favoriteFoods.slice(0, 10).map(({ food, count }) => (
                      <div key={food.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{food.name}</div>
                            <Badge variant="secondary" className="text-xs">{count}회</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">{food.serving}</div>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary">{food.calories}kcal</Badge>
                            <Badge variant="outline">P{food.protein}g</Badge>
                            <Badge variant="outline">C{food.carbs}g</Badge>
                            <Badge variant="outline">F{food.fat}g</Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addFood(food)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {favoriteFoods.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        즐겨찾기 음식이 없습니다
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}


            </CardContent>
          </Card>
          )}


        </TabsContent>

        <TabsContent value="tracker" className="space-y-4">
          <CalorieTracker />
          
          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">현재 식단 목표</span>
                <Badge variant="outline" className="flex items-center gap-1">
                  {dietSettings.type === 'maintenance' ? '⚖️ 체중 유지' :
                   dietSettings.type === 'intermittent' ? '⏰ 간헐적 단식' :
                   dietSettings.type === 'bulk' ? '💪 벌크업' :
                   dietSettings.type === 'cut' ? '🔥 체중 감량' :
                   dietSettings.type === 'keto' ? '🥑 케토제닉' :
                   dietSettings.type === 'mediterranean' ? '🫒 지중해식' :
                   dietSettings.type === 'dash' ? '🩺 DASH' :
                   dietSettings.type === 'highprotein' ? '💪 고단백' : '⚖️ 기본'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDietSettings(prev => ({ ...prev, initialized: false }));
                  setShowInitialSetup(true);
                }}
              >
                식단 목표 변경하기
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setTodaysFoods([]);
                  localStorage.removeItem('todaysFoods');
                }}
              >
                오늘 식단 초기화
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          {/* Today's Meal Plan */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary">{todaysMealPlan.totalCalories}</div>
                <div className="text-sm text-muted-foreground">오늘의 추천 총 칼로리</div>
                <div className="text-xs text-muted-foreground mt-1">
                  균형잡힌 하루 식단을 제안드려요!
                </div>
              </div>
              <NutritionChart 
                protein={todaysMealPlan.breakfast.protein + todaysMealPlan.lunch.protein + todaysMealPlan.dinner.protein}
                carbs={todaysMealPlan.breakfast.carbs + todaysMealPlan.lunch.carbs + todaysMealPlan.dinner.carbs}
                fat={todaysMealPlan.breakfast.fat + todaysMealPlan.lunch.fat + todaysMealPlan.dinner.fat}
              />
            </CardContent>
          </Card>

          {/* Recommended Meal Plan */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                오늘의 추천 식단
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MealCard meal={todaysMealPlan.breakfast} mealType="아침" time="07:00 - 09:00" />
              <MealCard meal={todaysMealPlan.lunch} mealType="점심" time="12:00 - 14:00" />
              <MealCard meal={todaysMealPlan.dinner} mealType="저녁" time="18:00 - 20:00" />
              
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">영양사 조언</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {dietSettings.type === 'cut' ? '🔥 체중 감량을 위한 저칼로리 고단백 식단입니다.' :
                   dietSettings.type === 'bulk' ? '💪 근육 증가를 위한 고칼로리 식단입니다.' :
                   dietSettings.type === 'keto' ? '🥑 케토제닉 다이어트를 위한 저탄수 고지방 식단입니다.' :
                   dietSettings.type === 'highprotein' ? '💪 고단백 식단으로 근육 유지에 효과적입니다.' :
                   '⚖️ 균형잡힌 식단으로 건강한 체중 유지에 좋습니다.'}
                  {' '}충분한 수분 섭취와 함께 하시면 더욱 효과적이에요!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-recipe" className="space-y-4">
          {/* AI Recipe Tab */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                AI 레시피 추천
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">집에 있는 재료를 입력하세요</label>
                <Textarea
                  placeholder="예: 닭가슴살, 브로콜리, 현미밥, 계란..."
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  재료를 쉼표(,)로 구분해서 입력하세요
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recipe Suggestions */}
          {ingredients && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>추천 레시피 ({recipeSuggestions.length}개)</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3 pr-4">
                    {recipeSuggestions.map(recipe => (
                      <RecipeCard key={recipe.id} recipe={recipe} />
                    ))}
                    {recipeSuggestions.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        입력하신 재료로 만들 수 있는 레시피가 없습니다.<br />
                        다른 재료를 추가해보세요!
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {!ingredients && (
            <Card>
              <CardContent className="p-8 text-center">
                <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-medium mb-2">재료를 입력해주세요</h3>
                <p className="text-sm text-muted-foreground">
                  집에 있는 재료를 입력하면<br />
                  맛있는 레시피를 추천해드려요!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}