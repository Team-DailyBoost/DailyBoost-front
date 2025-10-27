import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { LogIn, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  onSignup: () => void;
  onForgotPassword: () => void;
  onAccountRecovery: (email: string) => void;
}

export function Login({ onLogin, onSignup, onForgotPassword, onAccountRecovery }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    // Check for deleted/suspended account
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email);

    if (user && (user.status === 'deleted' || user.status === 'suspended')) {
      setShowRecovery(true);
      return;
    }

    onLogin(email, password);
  };

  const handleSocialLogin = (provider: string) => {
    setError(`${provider} 소셜 로그인은 준비 중입니다.`);
  };

  const handleRecovery = () => {
    setShowRecovery(false);
    onAccountRecovery(email);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-3xl">
                💪
              </div>
            </div>
            <CardTitle className="text-2xl">로그인</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            <Button onClick={handleLogin} className="w-full" size="lg">
              <LogIn className="mr-2 h-4 w-4" />
              로그인
            </Button>

            <div className="flex justify-between text-sm">
              <Button variant="link" className="p-0 h-auto" onClick={onSignup}>
                회원가입
              </Button>
              <Button variant="link" className="p-0 h-auto" onClick={onForgotPassword}>
                비밀번호 찾기
              </Button>
            </div>

            <div className="relative">
              <Separator className="my-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-card px-2 text-sm text-muted-foreground">또는</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('카카오')}
              >
                <div className="mr-2 w-5 h-5 bg-yellow-400 rounded flex items-center justify-center text-xs">
                  K
                </div>
                카카오 로그인
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin('네이버')}
              >
                <div className="mr-2 w-5 h-5 bg-green-500 rounded flex items-center justify-center text-xs text-white">
                  N
                </div>
                네이버 로그인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showRecovery} onOpenChange={setShowRecovery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>계정 복구</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                이 계정은 삭제되었거나 정지된 상태입니다. 계정을 복구하시겠습니까?
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowRecovery(false)} className="flex-1">
                취소
              </Button>
              <Button onClick={handleRecovery} className="flex-1">
                계정 복구
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
