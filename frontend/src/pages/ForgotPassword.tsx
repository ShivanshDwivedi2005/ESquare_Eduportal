import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/Loading';
import { authApi } from '@/services/auth';
import { apiErrorMessage } from '@/lib/apiError';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'The request could not be completed.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <form onSubmit={submit} className="surface-card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="mt-2 text-sm text-muted-foreground">{sent ? 'If an eligible account exists, a reset link has been sent.' : 'Enter your verified account email.'}</p>
        {!sent && <div className="mt-6 space-y-2"><Label htmlFor="reset-email">Email</Label><Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>}
        {!sent && <Button className="mt-6 w-full gap-2" disabled={pending}>{pending && <Spinner />}{pending ? 'Sending…' : 'Send reset link'}</Button>}
        <Link to="/login" className="mt-5 block text-center text-sm font-medium text-primary hover:underline">Back to sign in</Link>
      </form>
    </div>
  );
}
