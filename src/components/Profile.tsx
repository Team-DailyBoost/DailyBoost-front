import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { User, Target, Settings, Bell, Moon, Shield, HelpCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function Profile() {
  const [userInfo, setUserInfo] = useState({
    name: '김건강',
    email: 'kim.health@example.com',
    age: 28,
    height: 170,
    weight: 69.5,
    gender: 'male',
    activityLevel: 'moderate'
  });

  const [goals, setGoals] = useState({
    dailyCalories: 2000,
    weeklyExercise: 300, // minutes
    targetWeight: 68,
    waterIntake: 8 // glasses
  });

  const [settings, setSettings] = useState({
    notifications: true,
    darkMode: false,
    dataSharing: false,
    reminders: true
  });

  const handleSaveProfile = () => {
    toast.success('프로필이 저장되었습니다');
  };

  const handleSaveGoals = () => {
    toast.success('목표가 저장되었습니다');
  };

  const calculateBMI = () => {
    const heightInM = userInfo.height / 100;
    return (userInfo.weight / (heightInM * heightInM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { text: '저체중', color: 'text-blue-600' };
    if (bmi < 25) return { text: '정상', color: 'text-green-600' };
    if (bmi < 30) return { text: '과체중', color: 'text-orange-600' };
    return { text: '비만', color: 'text-red-600' };
  };

  const bmi = parseFloat(calculateBMI());
  const bmiCategory = getBMICategory(bmi);

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold">프로필</h1>
        <p className="text-muted-foreground">개인정보와 목표를 관리하세요</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">프로필</TabsTrigger>
          <TabsTrigger value="goals">목표</TabsTrigger>
          <TabsTrigger value="settings">설정</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Profile Picture */}
          <Card>
            <CardContent className="p-6 text-center">
              <Avatar className="w-20 h-20 mx-auto mb-3">
                <AvatarImage src="" />
                <AvatarFallback className="text-xl">김건</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">{userInfo.name}</h3>
              <p className="text-sm text-muted-foreground">{userInfo.email}</p>
            </CardContent>
          </Card>

          {/* BMI Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                BMI 지수
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{calculateBMI()}</div>
                <div className={`text-sm font-medium ${bmiCategory.color}`}>
                  {bmiCategory.text}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  키 {userInfo.height}cm, 몸무게 {userInfo.weight}kg
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                개인정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <Input
                    id="name"
                    value={userInfo.name}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">나이</Label>
                  <Input
                    id="age"
                    type="number"
                    value={userInfo.age}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="height">키 (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={userInfo.height}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">몸무게 (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={userInfo.weight}
                    onChange={(e) => setUserInfo(prev => ({ ...prev, weight: parseFloat(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>성별</Label>
                  <Select value={userInfo.gender} onValueChange={(value) => setUserInfo(prev => ({ ...prev, gender: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>활동 수준</Label>
                  <Select value={userInfo.activityLevel} onValueChange={(value) => setUserInfo(prev => ({ ...prev, activityLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음</SelectItem>
                      <SelectItem value="moderate">보통</SelectItem>
                      <SelectItem value="high">높음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSaveProfile} className="w-full">
                프로필 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                목표 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dailyCalories">일일 칼로리 목표 (kcal)</Label>
                <Input
                  id="dailyCalories"
                  type="number"
                  value={goals.dailyCalories}
                  onChange={(e) => setGoals(prev => ({ ...prev, dailyCalories: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyExercise">주간 운동 목표 (분)</Label>
                <Input
                  id="weeklyExercise"
                  type="number"
                  value={goals.weeklyExercise}
                  onChange={(e) => setGoals(prev => ({ ...prev, weeklyExercise: parseInt(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetWeight">목표 체중 (kg)</Label>
                <Input
                  id="targetWeight"
                  type="number"
                  step="0.1"
                  value={goals.targetWeight}
                  onChange={(e) => setGoals(prev => ({ ...prev, targetWeight: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waterIntake">일일 물 섭취 목표 (잔)</Label>
                <Input
                  id="waterIntake"
                  type="number"
                  value={goals.waterIntake}
                  onChange={(e) => setGoals(prev => ({ ...prev, waterIntake: parseInt(e.target.value) }))}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">목표 달성 예상</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• 현재 체중에서 목표 체중까지: {Math.abs(userInfo.weight - goals.targetWeight).toFixed(1)}kg</p>
                  <p>• 예상 달성 기간: 약 {Math.ceil(Math.abs(userInfo.weight - goals.targetWeight) * 4)}주</p>
                  <p>• 권장 주간 감량: 0.25kg</p>
                </div>
              </div>

              <Button onClick={handleSaveGoals} className="w-full">
                목표 저장
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                앱 설정
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <Label>알림 받기</Label>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <Label>다크 모드</Label>
                </div>
                <Switch
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, darkMode: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <Label>운동 알림</Label>
                </div>
                <Switch
                  checked={settings.reminders}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, reminders: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <Label>데이터 공유</Label>
                </div>
                <Switch
                  checked={settings.dataSharing}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, dataSharing: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                지원
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                자주 묻는 질문
              </Button>
              <Button variant="outline" className="w-full justify-start">
                고객 지원
              </Button>
              <Button variant="outline" className="w-full justify-start">
                피드백 보내기
              </Button>
              <Button variant="outline" className="w-full justify-start">
                개인정보 처리방침
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">
                FitTracker v1.0.0
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}