import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CalendarDays, Target, Flame, Activity, User, Settings, TrendingUp, Award, Scale, Zap, RefreshCw } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function Dashboard() {
  // Mock data
  const today = new Date().toLocaleDateString('ko-KR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });

  const dailyGoals = {
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 67,
    exercise: 60
  };

  const current = {
    calories: 1650,
    protein: 95,
    carbs: 180,
    fat: 52,
    exercise: 45
  };

  // Character states based on exercise completion
  const exerciseProgress = (current.exercise / dailyGoals.exercise) * 100;
  
  const getCharacterState = () => {
    if (exerciseProgress >= 100) {
      return {
        emoji: '💪',
        body: '💪😁💪',
        message: '완벽해요! 오늘의 목표를 달성했어요!',
        mood: 'excellent',
        color: 'text-green-600'
      };
    } else if (exerciseProgress >= 75) {
      return {
        emoji: '😊',
        body: '🙋‍♂️',
        message: '조금만 더 힘내세요! 거의 다 왔어요!',
        mood: 'good',
        color: 'text-blue-600'
      };
    } else if (exerciseProgress >= 50) {
      return {
        emoji: '😐',
        body: '🚶‍♂️',
        message: '절반 완료! 꾸준히 이어가세요!',
        mood: 'okay',
        color: 'text-yellow-600'
      };
    } else if (exerciseProgress >= 25) {
      return {
        emoji: '😔',
        body: '🤷‍♂️',
        message: '아직 시작이에요. 조금씩 움직여보세요!',
        mood: 'low',
        color: 'text-orange-600'
      };
    } else {
      return {
        emoji: '😴',
        body: '🛌',
        message: '오늘도 화이팅! 작은 움직임부터 시작해요!',
        mood: 'sleepy',
        color: 'text-gray-600'
      };
    }
  };

  const character = getCharacterState();

  // Mock InBody data (simulating real InBody connection)
  const inBodyData = {
    weight: 69.5,
    muscleMass: 32.8,
    bodyFatPercentage: 12.3,
    bmi: 24.1,
    lastUpdated: '2024-03-15 09:30',
    isConnected: true // In real app, this would check actual connection
  };

  const weeklyData = [
    { day: '월', calories: 1800, exercise: 30 },
    { day: '화', calories: 2100, exercise: 45 },
    { day: '수', calories: 1900, exercise: 60 },
    { day: '목', calories: 2200, exercise: 40 },
    { day: '금', calories: 1750, exercise: 55 },
    { day: '토', calories: 2300, exercise: 30 },
    { day: '일', calories: 1650, exercise: 45 }
  ];

  const weightData = [
    { week: '1주', weight: 70.5 },
    { week: '2주', weight: 70.2 },
    { week: '3주', weight: 69.8 },
    { week: '4주', weight: 69.5 }
  ];

  const achievements = [
    { title: '7일 연속 기록', achieved: true },
    { title: '주간 운동 목표 달성', achieved: true },
    { title: '체중 감량 1kg', achieved: false }
  ];

  const syncInBody = () => {
    toast.success('InBody 데이터를 동기화했습니다');
  };

  const connectInBody = () => {
    toast.info('InBody 앱 연동 설정으로 이동합니다');
  };

  const CalorieProgress = ({ current, goal, label, unit = 'g' }: { 
    current: number; 
    goal: number; 
    label: string; 
    unit?: string;
  }) => (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm">{current}{unit} / {goal}{unit}</span>
      </div>
      <Progress value={(current / goal) * 100} className="h-2" />
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header with Profile */}
      <div className="flex items-center justify-between py-2">
        <div>
          <h1 className="text-2xl font-bold">안녕하세요! 👋</h1>
          <p className="text-muted-foreground">{today}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <Settings className="h-5 w-5" />
          </Button>
          <Avatar>
            <AvatarImage src="" />
            <AvatarFallback>김건</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Character Section */}
      <Card className={`border-2 ${character.mood === 'excellent' ? 'border-green-300 bg-green-50 dark:bg-green-950' : 
                                  character.mood === 'good' ? 'border-blue-300 bg-blue-50 dark:bg-blue-950' :
                                  character.mood === 'okay' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950' :
                                  character.mood === 'low' ? 'border-orange-300 bg-orange-50 dark:bg-orange-950' :
                                  'border-gray-300 bg-gray-50 dark:bg-gray-950'}`}>
        <CardContent className="p-6 text-center">
          <div className="space-y-3">
            <div className="text-6xl animate-pulse">
              {character.body}
            </div>
            <div className={`font-medium ${character.color}`}>
              {character.message}
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>운동 진행률: {exerciseProgress.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* InBody Data Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              InBody 데이터
            </CardTitle>
            {inBodyData.isConnected ? (
              <Button variant="outline" size="sm" onClick={syncInBody}>
                <RefreshCw className="h-4 w-4 mr-1" />
                동기화
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={connectInBody}>
                연동하기
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {inBodyData.isConnected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-primary/5 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{inBodyData.weight}kg</div>
                  <div className="text-sm text-muted-foreground">체중</div>
                </div>
                <div className="text-center p-3 bg-blue-500/5 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{inBodyData.muscleMass}kg</div>
                  <div className="text-sm text-muted-foreground">골격근량</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-500/5 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{inBodyData.bodyFatPercentage}%</div>
                  <div className="text-sm text-muted-foreground">체지방률</div>
                </div>
                <div className="text-center p-3 bg-orange-500/5 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{inBodyData.bmi}</div>
                  <div className="text-sm text-muted-foreground">BMI</div>
                </div>
              </div>
              
              <div className="text-center text-xs text-muted-foreground">
                <Zap className="h-3 w-3 inline mr-1" />
                마지막 업데이트: {inBodyData.lastUpdated}
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-medium text-center mb-1">InBody 분석</div>
                <div className="text-xs text-muted-foreground text-center">
                  근육량이 평균보다 높고 체지방률이 적절한 상태입니다. 
                  현재 컨디션을 유지하며 꾸준한 운동을 권장합니다.
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Scale className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h4 className="font-medium mb-2">InBody 앱을 연동해보세요</h4>
              <p className="text-sm text-muted-foreground mb-4">
                체중, 골격근량, 체지방률을 자동으로<br />
                동기화하여 정확한 건강 관리를 해보세요
              </p>
              <Button onClick={connectInBody}>
                InBody 연동하기
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            오늘의 요약
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-primary/5 rounded-lg">
              <div className="text-2xl font-bold text-primary">{current.calories}</div>
              <div className="text-sm text-muted-foreground">섭취 칼로리</div>
            </div>
            <div className="text-center p-3 bg-destructive/5 rounded-lg">
              <div className="text-2xl font-bold text-destructive">{dailyGoals.calories - current.calories}</div>
              <div className="text-sm text-muted-foreground">남은 칼로리</div>
            </div>
          </div>
          
          <div className="pt-2">
            <CalorieProgress 
              current={current.calories} 
              goal={dailyGoals.calories} 
              label="일일 칼로리 목표" 
              unit="kcal"
            />
          </div>
        </CardContent>
      </Card>

      {/* Nutrition Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            영양소 현황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CalorieProgress current={current.protein} goal={dailyGoals.protein} label="단백질" />
          <CalorieProgress current={current.carbs} goal={dailyGoals.carbs} label="탄수화물" />
          <CalorieProgress current={current.fat} goal={dailyGoals.fat} label="지방" />
        </CardContent>
      </Card>

      {/* Exercise Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            운동 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalorieProgress 
            current={current.exercise} 
            goal={dailyGoals.exercise} 
            label="운동 시간" 
            unit="분"
          />
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4" />
            <span>약 320kcal 소모</span>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Progress Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            주간 칼로리 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" />
              <YAxis hide />
              <Bar dataKey="calories" fill="#8884d8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="text-center mt-2 text-sm text-muted-foreground">
            이번 주 평균: 1,957kcal
          </div>
        </CardContent>
      </Card>

      {/* Weight Trend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>체중 변화 (최근 4주)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={weightData}>
              <XAxis dataKey="week" />
              <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <span className="text-sm text-green-600 font-medium">-1.0kg 감량!</span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            최근 성취
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {achievements.map((achievement, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
              <span className="text-sm">{achievement.title}</span>
              <Badge variant={achievement.achieved ? "default" : "secondary"}>
                {achievement.achieved ? "완료" : "진행중"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-4 text-center">
            <Activity className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm">운동 시작</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardContent className="p-4 text-center">
            <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm">음식 기록</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}