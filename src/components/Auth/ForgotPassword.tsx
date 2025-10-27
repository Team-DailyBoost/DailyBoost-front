import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPassword({ open, onClose }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'newPassword' | 'success'>('email');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [sentCode, setSentCode] = useState('');

  const handleSendCode = () => {
    if (!email || !email.includes('@')) {
      setError('올바른 이메일을 입력해주세요.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.email === email);

    if (!user) {
      setError('등록되지 않은 이메일입니다.');
      return;
    }

    // Generate 6-digit code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(generatedCode);
    setError('');
    setStep('code');
    alert(`인증 코드가 이메일로 발송되었습니다.\n(데모용 코드: ${generatedCode})`);
  };

  const handleVerifyCode = () => {
    if (code !== sentCode) {
      setError('인증 코드가 일치하지 않습니다.');
      return;
    }
    setError('');
    setStep('newPassword');
  };

  const handleResetPassword = () => {
    if (!newPassword || newPassword.length < 4) {
      setError('비밀번호는 최소 4자 이상이어야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === email);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      localStorage.setItem('users', JSON.stringify(users));
    }

    setError('');
    setStep('success');
  };

  const handleClose = () => {
    setEmail('');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setStep('email');
    setSentCode('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>비밀번호 찾기</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 'email' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleSendCode} className="w-full">
                인증 코드 발송
              </Button>
            </>
          )}

          {step === 'code' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">인증 코드</Label>
                <Input
                  id="code"
                  placeholder="6자리 코드 입력"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                />
                <p className="text-sm text-muted-foreground">
                  {email}로 발송된 인증 코드를 입력하세요.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('email')} className="flex-1">
                  이전
                </Button>
                <Button onClick={handleVerifyCode} className="flex-1">
                  확인
                </Button>
              </div>
            </>
          )}

          {step === 'newPassword' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="newPassword">새 비밀번호</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="새 비밀번호"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="비밀번호 확인"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleResetPassword} className="w-full">
                비밀번호 변경
              </Button>
            </>
          )}

          {step === 'success' && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  비밀번호가 성공적으로 변경되었습니다.
                </AlertDescription>
              </Alert>
              <Button onClick={handleClose} className="w-full">
                로그인으로 돌아가기
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
