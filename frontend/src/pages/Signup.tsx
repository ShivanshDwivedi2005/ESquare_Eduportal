import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/Loading';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { authApi } from '@/services/auth';
import { apiErrorMessage } from '@/lib/apiError';
import { toast } from 'sonner';

export default function SignupPage() {
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  const register = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (pending) return;
    if (password.length < 12) return toast.error('Use at least 12 characters for your password');
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      return toast.error('Include uppercase, lowercase, and a number');
    }
    if (password !== confirmPassword) return toast.error('The passwords do not match');
    setPending(true);
    try {
      await authApi.register({
        firstName,
        lastName,
        email,
        password,
      });
      setStep('verify');
      toast.success('Check your email for the verification code');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'We could not start registration. Try again.'));
    } finally {
      setPending(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || code.length !== 6) return;
    setPending(true);
    try {
      await authApi.verifyEmail(email, code);
      toast.success('Email verified. You can now sign in.');
      navigate('/login', { replace: true, state: { verifiedEmail: email } });
    } catch (error) {
      toast.error(apiErrorMessage(error, 'That code is invalid or expired.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-surface-muted px-4 py-10 sm:py-14">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="mx-auto w-full max-w-lg">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"><GraduationCap className="h-4.5 w-4.5" /></span>
          <span className="font-display text-lg font-extrabold tracking-tight">ESQUARE</span>
        </Link>
        <div className="surface-card overflow-hidden">
          {step === 'details' ? (
            <form onSubmit={register} className="px-6 py-7 sm:px-8">
              <h1 className="text-2xl font-bold">Create your personal account</h1>
              <p className="mt-2 text-sm text-muted-foreground">One verified identity can hold different roles at multiple institutions.</p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="first-name">First name</Label><Input id="first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={100} required /></div>
                <div className="space-y-2"><Label htmlFor="last-name">Last name</Label><Input id="last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={100} required /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="signup-email">Email</Label><Input id="signup-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="signup-password">Password</Label><Input id="signup-password" type="password" autoComplete="new-password" minLength={12} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                <div className="space-y-2"><Label htmlFor="confirm-password">Confirm password</Label><Input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
              </div>
              <Button type="submit" className="mt-7 w-full gap-2" size="lg" disabled={pending}>{pending && <Spinner />}{pending ? 'Sending code…' : 'Create account'}</Button>
            </form>
          ) : (
            <form onSubmit={verify} className="px-6 py-8 sm:px-8">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary"><Mail className="h-5 w-5" /></div>
              <div className="mt-5 text-center"><h1 className="text-2xl font-bold">Verify your email</h1><p className="mt-2 text-sm text-muted-foreground">Enter the six-digit code sent to {email}.</p></div>
              <Label htmlFor="code" className="sr-only">Verification code</Label>
              <Input id="code" className="mx-auto mt-7 h-12 max-w-xs text-center font-mono text-xl tracking-[0.45em]" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus required />
              <Button type="submit" className="mt-6 w-full gap-2" size="lg" disabled={pending || code.length !== 6}>{pending && <Spinner />}{pending ? 'Verifying…' : 'Verify email'}</Button>
              <button type="button" className="mt-4 w-full text-xs font-medium text-primary hover:underline" onClick={() => void register()} disabled={pending}>Send a new code</button>
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
