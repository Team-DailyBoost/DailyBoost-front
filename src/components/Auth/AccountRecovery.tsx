import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AccountRecoveryProps {
  email: string;
  onRecover: () => void;
  onBack: () => void;
}

export function AccountRecovery({ email, onRecover, onBack }: AccountRecoveryProps) {
  const [step, setStep] = useState<'code' | 'success'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [sentCode] = useState('123456'); // Demo code

  const handleVerifyCode = () => {
    if (code !== sentCode) {
      setError('인증 코드가 일치하지 않습니다.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex !== -1) {
      users[userIndex].status = 'active';
      localStorage.setItem('users', JSON.stringify(users));
    }

    setError('');
    setStep('success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">계정 복구</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'code' && (
            <>
              <Alert>
                <AlertDescription>
                  {email}로 인증 코드가 발송되었습니다.
                  <br />
                  (데모용 코드: {sentCode})
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="code">인증 코드</Label>
                <Input
                  id="code"
                  placeholder="6자리 코드 입력"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={onBack} className="flex-1">
                  취소
                </Button>
                <Button onClick={handleVerifyCode} className="flex-1">
                  확인
                </Button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  계정이 성공적으로 복구되었습니다!
                </AlertDescription>
              </Alert>
              <Button onClick={onRecover} className="w-full">
                로그인하기
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
