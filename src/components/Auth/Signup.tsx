import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { AlertCircle, Upload, User } from 'lucide-react';

interface SignupProps {
  onSignup: (userData: UserData) => void;
  onBack: () => void;
}

export interface UserData {
  email: string;
  password: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  goal: string;
  profileImage?: string;
}

export function Signup({ onSignup, onBack }: SignupProps) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<Partial<UserData>>({
    gender: 'male',
    goal: 'weightLoss',
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profileImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.email || !formData.password || !formData.name) {
        setError('모든 필드를 입력해주세요.');
        return;
      }
      if (!formData.email.includes('@')) {
        setError('올바른 이메일 형식을 입력해주세요.');
        return;
      }
      if (formData.password.length < 4) {
        setError('비밀번호는 최소 4자 이상이어야 합니다.');
        return;
      }
    } else if (step === 2) {
      if (!formData.age || !formData.height || !formData.weight) {
        setError('모든 필드를 입력해주세요.');
        return;
      }
    }

    setError('');
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSignup(formData as UserData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            회원가입 {step}/3
          </CardTitle>
          <div className="flex gap-1 mt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password || ''}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  placeholder="홍길동"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>성별</Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">남성</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">여성</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other" id="other" />
                    <Label htmlFor="other">기타</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">나이</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="25"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height">키 (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="170"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">몸무게 (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="70"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>운동 목표</Label>
                <Select
                  value={formData.goal}
                  onValueChange={(value) => setFormData({ ...formData, goal: value })}
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

              <div className="space-y-2">
                <Label>프로필 사진 (선택)</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
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
                      id="profile-upload"
                    />
                    <Label htmlFor="profile-upload">
                      <Button variant="outline" className="w-full" asChild>
                        <span>
                          <Upload className="mr-2 h-4 w-4" />
                          사진 선택
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => (step === 1 ? onBack() : setStep(step - 1))}
              className="flex-1"
            >
              {step === 1 ? '취소' : '이전'}
            </Button>
            <Button onClick={handleNext} className="flex-1">
              {step === 3 ? '완료' : '다음'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
