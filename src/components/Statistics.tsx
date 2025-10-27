import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Target, Award } from 'lucide-react';

export function Statistics() {
  // Mock data for charts
  const weeklyCalories = [
    { day: '월', consumed: 1800, burned: 300, goal: 2000 },
    { day: '화', consumed: 2100, burned: 400, goal: 2000 },
    { day: '수', consumed: 1900, burned: 250, goal: 2000 },
    { day: '목', consumed: 2200, burned: 500, goal: 2000 },
    { day: '금', consumed: 1750, burned: 350, goal: 2000 },
    { day: '토', consumed: 2300, burned: 200, goal: 2000 },
    { day: '일', consumed: 1650, burned: 320, goal: 2000 }
  ];

  const monthlyWeight = [
    { week: '1주', weight: 70.5 },
    { week: '2주', weight: 70.2 },
    { week: '3주', weight: 69.8 },
    { week: '4주', weight: 69.5 }
  ];

  const macroDistribution = [
    { name: '탄수화물', value: 45, color: '#8884d8' },
    { name: '단백질', value: 30, color: '#82ca9d' },
    { name: '지방', value: 25, color: '#ffc658' }
  ];

  const exerciseTypes = [
    { name: '유산소', minutes: 150, color: '#ff7c7c' },
    { name: '근력운동', minutes: 90, color: '#8884d8' },
    { name: '유연성', minutes: 60, color: '#82ca9d' }
  ];

  const achievements = [
    { title: '7일 연속 기록', description: '일주일간 꾸준히 기록했어요!', achieved: true, date: '2024-03-10' },
    { title: '칼로리 목표 달성', description: '목표 칼로리를 달성했어요!', achieved: true, date: '2024-03-15' },
    { title: '운동 300분', description: '이번 주 운동 300분을 달성했어요!', achieved: false, progress: 240 },
    { title: '체중 감량 1kg', description: '체중을 1kg 감량했어요!', achieved: true, date: '2024-03-12' }
  ];

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold">통계</h1>
        <p className="text-muted-foreground">나의 건강 데이터를 확인하세요</p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">주간</TabsTrigger>
          <TabsTrigger value="monthly">월간</TabsTrigger>
          <TabsTrigger value="achievements">성취</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          {/* Weekly Calories */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                주간 칼로리 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyCalories}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Bar dataKey="consumed" fill="#8884d8" name="섭취" />
                  <Bar dataKey="burned" fill="#82ca9d" name="소모" />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#8884d8] rounded"></div>
                  <span className="text-sm">섭취 칼로리</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-[#82ca9d] rounded"></div>
                  <span className="text-sm">소모 칼로리</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Macro Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>영양소 비율 (이번 주 평균)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={150}>
                  <PieChart>
                    <Pie
                      data={macroDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {macroDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {macroDistribution.map((macro, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: macro.color }}></div>
                      <span className="text-sm">{macro.name}</span>
                      <Badge variant="outline">{macro.value}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exercise Types */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>운동 유형별 시간 (이번 주)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exerciseTypes.map((exercise, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{exercise.name}</span>
                      <span>{exercise.minutes}분</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: exercise.color,
                          width: `${(exercise.minutes / 150) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          {/* Monthly Weight Trend */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                월간 체중 변화
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyWeight}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis domain={['dataMin - 1', 'dataMax + 1']} />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="text-center mt-3">
                <div className="text-sm text-muted-foreground">
                  이번 달 체중 변화: <span className="text-green-600 font-medium">-1.0kg</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-primary">28</div>
                <div className="text-sm text-muted-foreground">기록한 날</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-destructive">1,240</div>
                <div className="text-sm text-muted-foreground">총 소모 칼로리</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>월간 목표 달성률</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>일일 칼로리 목표</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>주간 운동 목표</span>
                  <span>92%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                성취 목록
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement, index) => (
                <div key={index} className={`p-3 border rounded-lg ${achievement.achieved ? 'bg-green-50 border-green-200' : 'bg-muted/50'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{achievement.title}</h4>
                        {achievement.achieved && (
                          <Badge className="bg-green-500 text-white">완료</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      {achievement.achieved && achievement.date && (
                        <p className="text-xs text-green-600 mt-1">
                          달성일: {achievement.date}
                        </p>
                      )}
                      {!achievement.achieved && achievement.progress && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>진행률</span>
                            <span>{achievement.progress}/300분</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-primary h-1.5 rounded-full" 
                              style={{ width: `${(achievement.progress! / 300) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-green-600">12</div>
                <div className="text-xs text-muted-foreground">달성한 목표</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-blue-600">3</div>
                <div className="text-xs text-muted-foreground">진행 중</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-lg font-bold text-primary">15</div>
                <div className="text-xs text-muted-foreground">총 성취</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}