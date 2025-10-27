import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import {
  Settings,
  User,
  Bell,
  Moon,
  Globe,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit,
  Upload,
  AlertCircle,
  Trash2,
  Trophy,
  Crown,
  Star,
  Award,
  Medal,
  Users,
} from 'lucide-react';

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

interface MyPageProps {
  onLogout?: () => void;
}

export function MyPage({ onLogout }: MyPageProps) {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>({});
  const [editData, setEditData] = useState<any>({});
  const [userProgress, setUserProgress] = useState<any>(null);
  const [followers, setFollowers] = useState<string[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    setEditData(user);
    
    const userId = user.email || 'guest';
    const progress = localStorage.getItem(`userProgress_${userId}`);
    if (progress) {
      setUserProgress(JSON.parse(progress));
    }
    
    const savedFollowing = localStorage.getItem(`following_${userId}`);
    if (savedFollowing) {
      setFollowing(JSON.parse(savedFollowing));
    }
    
    // Count followers
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const followerCount = users.filter((u: any) => {
      const userFollowing = JSON.parse(localStorage.getItem(`following_${u.email}`) || '[]');
      return userFollowing.includes(userId);
    }).length;
    setFollowers(Array(followerCount).fill(''));
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditData({ ...editData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === currentUser.email);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...editData };
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('currentUser', JSON.stringify(users[userIndex]));
      setCurrentUser(users[userIndex]);
    }
    
    setShowEditDialog(false);
  };

  const handleDeleteAccount = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === currentUser.email);
    
    if (userIndex !== -1) {
      users[userIndex].status = 'deleted';
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.removeItem('currentUser');
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('currentUser');
      window.location.reload();
    }
  };

  const MenuItem = ({
    icon: Icon,
    title,
    subtitle,
    onClick,
    showArrow = true,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onClick?: () => void;
    showArrow?: boolean;
  }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
    >
      <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <div className="font-medium">{title}</div>
        {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
      </div>
      {showArrow && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </button>
  );

  const goalLabels: Record<string, string> = {
    weightLoss: '체중 감량',
    muscleGain: '근육 증가',
    maintenance: '체중 유지',
    fitness: '체력 향상',
    health: '건강 관리',
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'bronze': return <Award className={`h-5 w-5 ${TIER_COLORS.bronze}`} />;
      case 'silver': return <Medal className={`h-5 w-5 ${TIER_COLORS.silver}`} />;
      case 'gold': return <Trophy className={`h-5 w-5 ${TIER_COLORS.gold}`} />;
      case 'platinum': return <Star className={`h-5 w-5 ${TIER_COLORS.platinum}`} />;
      case 'diamond': return <Crown className={`h-5 w-5 ${TIER_COLORS.diamond}`} />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center justify-between py-2">
        <h1 className="text-2xl font-bold">마이페이지</h1>
        <Button variant="ghost" size="sm" onClick={() => setShowEditDialog(true)}>
          <Edit className="h-5 w-5" />
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar className="h-16 w-16">
              {currentUser.profileImage ? (
                <img
                  src={currentUser.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarFallback className="text-xl bg-primary/10">
                  <User className="h-8 w-8" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{currentUser.name || '사용자'}</h2>
                {userProgress && userProgress.tier && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getTierIcon(userProgress.tier)}
                    <span className={TIER_COLORS[userProgress.tier as keyof typeof TIER_COLORS]}>
                      {TIER_NAMES[userProgress.tier as keyof typeof TIER_NAMES]}
                    </span>
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              {userProgress && (
                <p className="text-xs text-muted-foreground mt-1">
                  {userProgress.exp.toLocaleString()} EXP
                </p>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">나이</div>
                <div className="font-medium">{currentUser.age || '-'}세</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">성별</div>
                <div className="font-medium">
                  {currentUser.gender === 'male'
                    ? '남성'
                    : currentUser.gender === 'female'
                    ? '여성'
                    : '기타'}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">키</div>
                <div className="font-medium">{currentUser.height || '-'}cm</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">몸무게</div>
                <div className="font-medium">{currentUser.weight || '-'}kg</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-1">운동 목표</div>
              <div className="font-medium">
                {goalLabels[currentUser.goal] || '-'}
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">45</div>
              <div className="text-xs text-muted-foreground mt-1">운동일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">7</div>
              <div className="text-xs text-muted-foreground mt-1">연속일</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{followers.length}</div>
              <div className="text-xs text-muted-foreground mt-1">팔로워</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{following.length}</div>
              <div className="text-xs text-muted-foreground mt-1">팔로잉</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <div className="flex items-center gap-3 p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">알림</div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <div className="flex items-center gap-3 p-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-medium">다크 모드</div>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>

          <MenuItem icon={Globe} title="언어" subtitle="한국어" />
          <MenuItem icon={Shield} title="개인정보 보호" />
          <MenuItem icon={HelpCircle} title="도움말" />
        </CardContent>
      </Card>

      {/* Account Actions */}
      <div className="space-y-2">
        <Button variant="outline" className="w-full" size="lg" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>
        <Button
          variant="outline"
          className="w-full text-destructive"
          size="lg"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          계정 삭제
        </Button>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>프로필 편집</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>프로필 사진</Label>
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20">
                  {editData.profileImage ? (
                    <img
                      src={editData.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <AvatarFallback>
                      <User className="w-10 h-10" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="profile-edit-upload"
                  />
                  <Label htmlFor="profile-edit-upload">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" />
                        사진 변경
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">이름</Label>
              <Input
                id="edit-name"
                value={editData.name || ''}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>성별</Label>
              <RadioGroup
                value={editData.gender}
                onValueChange={(value: any) =>
                  setEditData({ ...editData, gender: value })
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="edit-male" />
                  <Label htmlFor="edit-male">남성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="edit-female" />
                  <Label htmlFor="edit-female">여성</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="edit-other" />
                  <Label htmlFor="edit-other">기타</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-age">나이</Label>
              <Input
                id="edit-age"
                type="number"
                value={editData.age || ''}
                onChange={(e) =>
                  setEditData({ ...editData, age: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-height">키 (cm)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  value={editData.height || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, height: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-weight">몸무게 (kg)</Label>
                <Input
                  id="edit-weight"
                  type="number"
                  value={editData.weight || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, weight: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>운동 목표</Label>
              <Select
                value={editData.goal}
                onValueChange={(value) => setEditData({ ...editData, goal: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="목표를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weightLoss">체중 감량</SelectItem>
                  <SelectItem value="muscleGain">근육 증가</SelectItem>
                  <SelectItem value="maintenance">체중 유지</SelectItem>
                  <SelectItem value="fitness">체력 향상</SelectItem>
                  <SelectItem value="health">건강 관리</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowEditDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button onClick={handleSaveProfile} className="flex-1">
                저장
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계정 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                계정을 삭제하시겠습니까? 이 작업은 30일 이내에 복구할 수 있습니다.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="flex-1"
              >
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}