import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/Loading';
import { authApi } from '@/services/auth';
import { apiErrorMessage } from '@/lib/apiError';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();
  const token = searchParams.get('t') ?? '';

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) return toast.error('The passwords do not match');
    setPending(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password updated. Sign in again on all devices.');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The reset link is invalid or expired.'));
    } finally {
      setPending(false);
    }
  };

  if (!token) return <div className="flex min-h-screen items-center justify-center"><Link to="/forgot-password" className="text-primary hover:underline">Request a new reset link</Link></div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <form onSubmit={submit} className="surface-card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Choose a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">Use 12–128 characters with uppercase, lowercase, and a number.</p>
        <div className="mt-6 space-y-2"><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <div className="mt-4 space-y-2"><Label htmlFor="confirm-new-password">Confirm password</Label><Input id="confirm-new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
        <Button className="mt-6 w-full gap-2" disabled={pending}>{pending && <Spinner />}{pending ? 'Updating…' : 'Update password'}</Button>
      </form>
    </div>
  );
}
