import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Trophy, Medal, Target, Users, Clock, Flame, Zap, Crown, Star, Award } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface RankingUser {
  id: string;
  name: string;
  avatar?: string;
  score: number;
  unit: string;
  rank: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  exp?: number;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  duration: string;
  participants: number;
  reward: string;
  progress: number;
  isJoined: boolean;
  type: 'weekly' | 'monthly' | 'daily' | 'competition' | 'exercise';
  exp?: number;
  exerciseType?: string;
  sets?: number;
  reps?: number;
}

interface UserProgress {
  userId: string;
  exp: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  lastReset: string;
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 1000,
  gold: 3000,
  platinum: 6000,
  diamond: 10000,
};

const TIER_COLORS = {
  bronze: 'text-amber-700',
  silver: 'text-gray-500',
  gold: 'text-yellow-500',
  platinum: 'text-cyan-500',
  diamond: 'text-purple-500',
};

const TIER_NAMES = {
  bronze: '브론즈',
  silver: '실버',
  gold: '골드',
  platinum: '플래티넘',
  diamond: '다이아',
};

export function Challenge() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [showChallengeDialog, setShowChallengeDialog] = useState(false);
  const [customChallenge, setCustomChallenge] = useState({
    exerciseType: '',
    sets: 3,
    reps: 10,
  });
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [allUsersProgress, setAllUsersProgress] = useState<UserProgress[]>([]);

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const userId = currentUser.email || 'guest';

  useEffect(() => {
    loadUserProgress();
    checkMonthlyReset();
  }, [userId]);

  const loadUserProgress = () => {
    const saved = localStorage.getItem(`userProgress_${userId}`);
    const allProgress = localStorage.getItem('allUsersProgress') || '[]';
    
    if (saved) {
      setUserProgress(JSON.parse(saved));
    } else {
      const initial: UserProgress = {
        userId,
        exp: 0,
        tier: 'bronze',
        lastReset: new Date().toISOString(),
      };
      setUserProgress(initial);
      localStorage.setItem(`userProgress_${userId}`, JSON.stringify(initial));
    }
    
    setAllUsersProgress(JSON.parse(allProgress));
  };

  const checkMonthlyReset = () => {
    if (!userProgress) return;
    
    const lastReset = new Date(userProgress.lastReset);
    const now = new Date();
    
    if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
      const reset: UserProgress = {
        ...userProgress,
        exp: 0,
        tier: 'bronze',
        lastReset: now.toISOString(),
      };
      setUserProgress(reset);
      localStorage.setItem(`userProgress_${userId}`, JSON.stringify(reset));
      toast.info('새로운 달이 시작되었습니다! 등급이 초기화되었습니다.');
    }
  };

  const addExp = (amount: number) => {
    if (!userProgress) return;
    
    const newExp = userProgress.exp + amount;
    let newTier = userProgress.tier;
    
    if (newExp >= TIER_THRESHOLDS.diamond) newTier = 'diamond';
    else if (newExp >= TIER_THRESHOLDS.platinum) newTier = 'platinum';
    else if (newExp >= TIER_THRESHOLDS.gold) newTier = 'gold';
    else if (newExp >= TIER_THRESHOLDS.silver) newTier = 'silver';
    else newTier = 'bronze';
    
    const updated: UserProgress = {
      ...userProgress,
      exp: newExp,
      tier: newTier,
    };
    
    setUserProgress(updated);
    localStorage.setItem(`userProgress_${userId}`, JSON.stringify(updated));
    
    // Update global progress
    const allProgress = JSON.parse(localStorage.getItem('allUsersProgress') || '[]');
    const index = allProgress.findIndex((p: UserProgress) => p.userId === userId);
    if (index !== -1) {
      allProgress[index] = updated;
    } else {
      allProgress.push(updated);
    }
    localStorage.setItem('allUsersProgress', JSON.stringify(allProgress));
    setAllUsersProgress(allProgress);
    
    if (newTier !== userProgress.tier) {
      toast.success(`축하합니다! ${TIER_NAMES[newTier]} 등급으로 승급하셨습니다! 🎉`);
    }
  };

  const weeklyExerciseRanking: RankingUser[] = [
    { id: '1', name: '박헬스', score: 420, unit: '분', rank: 1 },
    { id: '2', name: '김런닝', score: 380, unit: '분', rank: 2 },
    { id: '3', name: '이웨이트', score: 350, unit: '분', rank: 3 },
    { id: '4', name: '최요가', score: 320, unit: '분', rank: 4 },
    { id: '5', name: '정스쿼트', score: 290, unit: '분', rank: 5 },
    { id: '6', name: '나 (김건강)', score: 275, unit: '분', rank: 6 }
  ];

  const weeklyCalorieRanking: RankingUser[] = [
    { id: '1', name: '이다이어트', score: 3500, unit: 'kcal', rank: 1 },
    { id: '2', name: '박번업', score: 3200, unit: 'kcal', rank: 2 },
    { id: '3', name: '김러닝', score: 2980, unit: 'kcal', rank: 3 },
    { id: '4', name: '나 (김건강)', score: 2850, unit: 'kcal', rank: 4 },
    { id: '5', name: '최컷팅', score: 2700, unit: 'kcal', rank: 5 },
    { id: '6', name: '정헬시', score: 2650, unit: 'kcal', rank: 6 }
  ];

  const stepRanking: RankingUser[] = [
    { id: '1', name: '박만보', score: 85000, unit: '걸음', rank: 1 },
    { id: '2', name: '김걸음', score: 78000, unit: '걸음', rank: 2 },
    { id: '3', name: '이산책', score: 72000, unit: '걸음', rank: 3 },
    { id: '4', name: '나 (김건강)', score: 68000, unit: '걸음', rank: 4 },
    { id: '5', name: '정조깅', score: 65000, unit: '걸음', rank: 5 },
    { id: '6', name: '최러닝', score: 62000, unit: '걸음', rank: 6 }
  ];

  // Competition ranking (from Community)
  const getCompetitionRanking = (): RankingUser[] => {
    const entries = JSON.parse(localStorage.getItem('competitionEntries') || '[]');
    return entries
      .sort((a: any, b: any) => b.votes - a.votes)
      .slice(0, 10)
      .map((entry: any, idx: number) => ({
        id: entry.id,
        name: entry.userName,
        score: entry.votes,
        unit: '표',
        rank: idx + 1,
      }));
  };

  const competitionRanking = getCompetitionRanking();

  const challenges: Challenge[] = [
    {
      id: '1',
      title: '7일 연속 운동 챌린지',
      description: '일주일간 매일 30분 이상 운동하기',
      duration: '7일',
      participants: 1247,
      reward: '🏆 골드 배지',
      progress: 57,
      isJoined: true,
      type: 'weekly',
      exp: 500,
    },
    {
      id: '2',
      title: '만보 걷기 챌린지',
      description: '하루 10,000보 걷기를 한 달간 도전',
      duration: '30일',
      participants: 3521,
      reward: '🥇 워킹 마스터',
      progress: 23,
      isJoined: false,
      type: 'monthly',
      exp: 1000,
    },
    {
      id: '3',
      title: '물 마시기 챌린지',
      description: '하루 8잔 이상의 물 마시기',
      duration: '오늘',
      participants: 892,
      reward: '💧 하이드레이션',
      progress: 75,
      isJoined: true,
      type: 'daily',
      exp: 100,
    },
    {
      id: '4',
      title: '플랭크 30일 챌린지',
      description: '매일 플랭크 1분 이상',
      duration: '30일',
      participants: 567,
      reward: '💪 코어 킹',
      progress: 35,
      isJoined: false,
      type: 'exercise',
      exp: 800,
      exerciseType: '플랭크',
      sets: 3,
      reps: 60,
    },
    {
      id: '5',
      title: '스쿼트 100개 챌린지',
      description: '매일 스쿼트 100개 달성',
      duration: '14일',
      participants: 1203,
      reward: '🦵 레그 마스터',
      progress: 0,
      isJoined: false,
      type: 'exercise',
      exp: 600,
      exerciseType: '스쿼트',
      sets: 5,
      reps: 20,
    },
    {
      id: '6',
      title: '푸시업 50개 챌린지',
      description: '매일 푸시업 50개 달성',
      duration: '7일',
      participants: 845,
      reward: '💪 상체 킹',
      progress: 0,
      isJoined: false,
      type: 'exercise',
      exp: 400,
      exerciseType: '푸시업',
      sets: 5,
      reps: 10,
    },
    {
      id: 'comp1',
      title: '피지크 대회 참가',
      description: '커뮤니티 피지크 대회에 참가하세요',
      duration: '진행중',
      participants: competitionRanking.length,
      reward: '🏆 대회 참가상',
      progress: 0,
      isJoined: false,
      type: 'competition',
      exp: 1500,
    },
  ];

  const joinChallenge = (challengeId: string) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge && challenge.exp) {
      addExp(challenge.exp);
      toast.success(`챌린지에 참여했습니다! +${challenge.exp} EXP`);
    }
  };

  const createCustomChallenge = () => {
    if (!customChallenge.exerciseType) {
      toast.error('운동 종류를 입력해주세요!');
      return;
    }
    
    const exp = customChallenge.sets * customChallenge.reps * 2; // 경험치 계산
    addExp(exp);
    toast.success(`맞춤 챌린지가 생성되었습니다! +${exp} EXP`);
    setShowChallengeDialog(false);
    setCustomChallenge({ exerciseType: '', sets: 3, reps: 10 });
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600';
      case 2: return 'text-gray-500';
      case 3: return 'text-amber-600';
      default: return 'text-muted-foreground';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-5 w-5 text-yellow-600" />;
      case 2: return <Medal className="h-5 w-5 text-gray-500" />;
      case 3: return <Medal className="h-5 w-5 text-amber-600" />;
      default: return <span className="text-sm font-bold w-5 text-center">{rank}</span>;
    }
  };

  const getTierIcon = (tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond') => {
    switch (tier) {
      case 'bronze': return <Award className={`h-5 w-5 ${TIER_COLORS.bronze}`} />;
      case 'silver': return <Medal className={`h-5 w-5 ${TIER_COLORS.silver}`} />;
      case 'gold': return <Trophy className={`h-5 w-5 ${TIER_COLORS.gold}`} />;
      case 'platinum': return <Star className={`h-5 w-5 ${TIER_COLORS.platinum}`} />;
      case 'diamond': return <Crown className={`h-5 w-5 ${TIER_COLORS.diamond}`} />;
    }
  };

  const getNextTierExp = () => {
    if (!userProgress) return 0;
    const tiers = Object.keys(TIER_THRESHOLDS) as Array<keyof typeof TIER_THRESHOLDS>;
    const currentIndex = tiers.indexOf(userProgress.tier);
    if (currentIndex === tiers.length - 1) return TIER_THRESHOLDS.diamond;
    return TIER_THRESHOLDS[tiers[currentIndex + 1]];
  };

  const getTierRanking = (tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond') => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const progress = JSON.parse(localStorage.getItem('allUsersProgress') || '[]') as UserProgress[];
    
    return progress
      .filter(p => p.tier === tier)
      .sort((a, b) => b.exp - a.exp)
      .slice(0, 10)
      .map((p, idx) => {
        const user = users.find((u: any) => u.email === p.userId);
        return {
          id: p.userId,
          name: user?.name || '사용자',
          score: p.exp,
          unit: 'EXP',
          rank: idx + 1,
          tier: p.tier,
          exp: p.exp,
        };
      });
  };

  const RankingCard = ({ users, title, icon }: { users: RankingUser[], title: string, icon: React.ReactNode }) => (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            아직 랭킹이 없습니다
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className={`flex items-center gap-3 p-3 rounded-lg ${user.name.includes('나 (') ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'}`}>
              <div className="flex items-center justify-center w-8">
                {getRankIcon(user.rank)}
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{user.name.slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {user.name}
                  {user.tier && getTierIcon(user.tier)}
                </div>
                <div className="text-sm text-muted-foreground">{user.score.toLocaleString()}{user.unit}</div>
              </div>
              {user.rank <= 3 && (
                <Badge variant={user.rank === 1 ? "default" : "secondary"}>
                  TOP {user.rank}
                </Badge>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );

  const nextTierExp = getNextTierExp();
  const expProgress = userProgress ? (userProgress.exp / nextTierExp) * 100 : 0;

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="text-center py-2">
        <h1 className="text-2xl font-bold">챌린지 🏆</h1>
        <p className="text-muted-foreground">친구들과 함께 건강한 경쟁을 즐겨보세요</p>
      </div>

      {/* User Tier Card */}
      {userProgress && (
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getTierIcon(userProgress.tier)}
                <div>
                  <div className={`font-bold text-lg ${TIER_COLORS[userProgress.tier]}`}>
                    {TIER_NAMES[userProgress.tier]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {userProgress.exp.toLocaleString()} EXP
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">다음 등급까지</div>
                <div className="font-medium">{(nextTierExp - userProgress.exp).toLocaleString()} EXP</div>
              </div>
            </div>
            <Progress value={expProgress} className="h-2" />
            <div className="text-xs text-muted-foreground mt-2 text-center">
              매달 1일 등급이 초기화됩니다
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">이번 주</TabsTrigger>
          <TabsTrigger value="tier">등급별</TabsTrigger>
          <TabsTrigger value="challenges">도전과제</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          {/* My Rank Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">전체 6위</div>
                <div className="text-sm text-muted-foreground">운동 시간 기준</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  1위까지 145분 차이! 힘내세요! 💪
                </div>
              </div>
            </CardContent>
          </Card>

          <RankingCard 
            users={weeklyExerciseRanking}
            title="운동 시간 랭킹"
            icon={<Clock className="h-5 w-5" />}
          />

          <RankingCard 
            users={weeklyCalorieRanking}
            title="칼로리 소모 랭킹"
            icon={<Flame className="h-5 w-5" />}
          />

          <RankingCard 
            users={stepRanking}
            title="걸음 수 랭킹"
            icon={<Zap className="h-5 w-5" />}
          />

          <RankingCard 
            users={competitionRanking}
            title="대회 랭킹 (득표수)"
            icon={<Trophy className="h-5 w-5" />}
          />
        </TabsContent>

        <TabsContent value="tier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>등급별 순위</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="diamond">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="bronze" className="text-xs">브론즈</TabsTrigger>
                  <TabsTrigger value="silver" className="text-xs">실버</TabsTrigger>
                  <TabsTrigger value="gold" className="text-xs">골드</TabsTrigger>
                  <TabsTrigger value="platinum" className="text-xs">플래티넘</TabsTrigger>
                  <TabsTrigger value="diamond" className="text-xs">다이아</TabsTrigger>
                </TabsList>

                {(['diamond', 'platinum', 'gold', 'silver', 'bronze'] as const).map(tier => (
                  <TabsContent key={tier} value={tier} className="mt-4">
                    <RankingCard
                      users={getTierRanking(tier)}
                      title={`${TIER_NAMES[tier]} 랭킹`}
                      icon={getTierIcon(tier)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-4">
          {/* Create Custom Challenge Button */}
          <Button className="w-full" onClick={() => setShowChallengeDialog(true)}>
            <Target className="h-4 w-4 mr-2" />
            맞춤 운동 챌린지 만들기
          </Button>

          {/* Active Challenges */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                참여 중인 챌린지
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {challenges.filter(c => c.isJoined).map(challenge => (
                <div key={challenge.id} className="p-3 border rounded-lg bg-primary/5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      {challenge.exerciseType && (
                        <div className="text-xs text-primary mt-1">
                          {challenge.sets}세트 × {challenge.reps}회
                        </div>
                      )}
                    </div>
                    <Badge>{challenge.duration}</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>진행률</span>
                      <span>{challenge.progress}%</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{challenge.participants.toLocaleString()}명 참여</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{challenge.reward}</span>
                      {challenge.exp && (
                        <Badge variant="outline">+{challenge.exp} EXP</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Available Challenges */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>새로운 챌린지</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {challenges.filter(c => !c.isJoined).map(challenge => (
                <div key={challenge.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                      {challenge.exerciseType && (
                        <div className="text-xs text-primary mt-1">
                          매일 {challenge.exerciseType}: {challenge.sets}세트 × {challenge.reps}회
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">{challenge.duration}</Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{challenge.participants.toLocaleString()}명</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{challenge.reward}</span>
                        {challenge.exp && (
                          <Badge variant="outline">+{challenge.exp} EXP</Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => joinChallenge(challenge.id)}>참여하기</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Challenge Dialog */}
      <Dialog open={showChallengeDialog} onOpenChange={setShowChallengeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>맞춤 운동 챌린지 만들기</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>운동 종류</Label>
              <Input
                placeholder="예: 스쿼트, 푸시업, 플랭크..."
                value={customChallenge.exerciseType}
                onChange={(e) => setCustomChallenge({ ...customChallenge, exerciseType: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>세트 수</Label>
                <Input
                  type="number"
                  min="1"
                  value={customChallenge.sets}
                  onChange={(e) => setCustomChallenge({ ...customChallenge, sets: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>횟수</Label>
                <Input
                  type="number"
                  min="1"
                  value={customChallenge.reps}
                  onChange={(e) => setCustomChallenge({ ...customChallenge, reps: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="bg-accent p-3 rounded-lg">
              <div className="text-sm font-medium mb-1">예상 보상</div>
              <div className="text-lg font-bold text-primary">
                +{customChallenge.sets * customChallenge.reps * 2} EXP
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowChallengeDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button onClick={createCustomChallenge} className="flex-1">
                생성하기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
