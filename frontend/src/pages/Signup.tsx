import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AtSign, Check, GraduationCap, Mail, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/common/Loading';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { apiErrorMessage } from '@/lib/apiError';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';


type Availability = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

const usernamePattern = /^[a-z0-9_](?:[a-z0-9_.]*[a-z0-9_])?$/;


export default function SignupPage() {
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const location = useLocation();
  const googleEmail = (location.state as { emailFromGoogle?: string } | null)?.emailFromGoogle;
  const [email, setEmail] = useState(googleEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [availability, setAvailability] = useState<Availability>('idle');
  const [pending, setPending] = useState(false);
  const signup = useAuthStore((state) => state.signup);
  const navigate = useNavigate();

  useEffect(() => {
    if (!username) {
      setAvailability('idle');
      return;
    }
    if (username.length < 3 || username.length > 50 || !usernamePattern.test(username)) {
      setAvailability('invalid');
      return;
    }

    setAvailability('checking');
    const timeout = window.setTimeout(async () => {
      try {
        const result = await authApi.checkUsername(username);
        setAvailability(result.available ? 'available' : 'taken');
      } catch {
        setAvailability('idle');
      }
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [username]);

  const requestCode = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (pending) return;
    if (!displayName.trim()) return toast.error('Enter your name');
    if (availability !== 'available') return toast.error('Choose an available username');
    if (password.length < 8) return toast.error('Use at least 8 characters for your password');
    if (password !== confirmPassword) return toast.error('The passwords do not match');

    setPending(true);
    try {
      await authApi.sendOtp(email);
      setStep('verify');
      toast.success('Verification code sent');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'We could not send the code. Try again.'));
    } finally {
      setPending(false);
    }
  };

  const createAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending || otp.length !== 6) return;
    setPending(true);

    try {
      const verificationToken = await authApi.verifyOtp(email, otp);
      await signup({ displayName, username, email, password, verificationToken });
      toast.success('Your account is ready');
      navigate('/app/feed', { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error, 'We could not create your account. Try again.'));
    } finally {
      setPending(false);
    }
  };

  const availabilityCopy = {
    idle: '3–50 characters. Letters, numbers, underscores, and periods.',
    checking: 'Checking username…',
    available: 'Username is available',
    taken: 'That username is already taken',
    invalid: 'Use 3–50 valid characters; periods cannot be first or last.',
  }[availability];

  return (
    <div className="relative min-h-screen bg-surface-muted px-4 py-10 sm:py-14">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <div className="mx-auto w-full max-w-lg">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">ESQUARE</span>
        </Link>

        <div className="surface-card overflow-hidden">
          <div className="border-b border-border px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{step === 'details' ? 'Create your account' : 'Check your email'}</span>
              <span>{step === 'details' ? '1 of 2' : '2 of 2'}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <span className="h-1 rounded-full bg-primary" />
              <span className={cn('h-1 rounded-full', step === 'verify' ? 'bg-primary' : 'bg-border')} />
            </div>
          </div>

          {step === 'details' ? (
            <form onSubmit={requestCode} className="px-6 py-7 sm:px-8">
              <div className="mb-7">
                <h1 className="text-2xl font-bold">Start with one personal account</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  You’ll begin with the general workspace. Institution tools appear after an administrator approves your role.
                </p>
                {googleEmail && (
                  <p className="mt-3 rounded-md bg-primary-soft px-3 py-2 text-xs text-primary">
                    Google verified {googleEmail}. We’ll also email a one-time code before creating this account.
                  </p>
                )}
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="display-name">Your name</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="display-name"
                      className="pl-9"
                      autoComplete="name"
                      maxLength={100}
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="The name people know you by"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="username">Username</Label>
                    <span className="text-xs text-muted-foreground">{username.length}/50</span>
                  </div>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      className="pl-9 pr-9"
                      autoComplete="username"
                      maxLength={50}
                      value={username}
                      onChange={(event) => setUsername(event.target.value.trim().toLowerCase())}
                      placeholder="yourname"
                      aria-describedby="username-status"
                      required
                    />
                    {availability === 'available' && <Check className="absolute right-3 top-3 h-4 w-4 text-success" />}
                    {availability === 'checking' && <span className="absolute right-3 top-3"><Spinner /></span>}
                  </div>
                  <p
                    id="username-status"
                    className={cn(
                      'text-xs',
                      availability === 'available' && 'text-success',
                      (availability === 'taken' || availability === 'invalid') ? 'text-destructive' : 'text-muted-foreground',
                    )}
                  >
                    {availabilityCopy}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      className="pl-9"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" className="mt-7 w-full gap-2" size="lg" disabled={pending || availability !== 'available'}>
                {pending && <Spinner />}{pending ? 'Sending code…' : 'Continue'}
              </Button>
              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground">
                By continuing, you agree to follow ESQUARE’s community and account policies.
              </p>
            </form>
          ) : (
            <form onSubmit={createAccount} className="px-6 py-8 sm:px-8">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div className="mt-5 text-center">
                <h1 className="text-2xl font-bold">Enter the six-digit code</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  We sent it to <span className="font-medium text-foreground">{email}</span>. It expires in five minutes.
                </p>
              </div>

              <Label htmlFor="otp" className="sr-only">Verification code</Label>
              <Input
                id="otp"
                className="mx-auto mt-7 h-12 max-w-xs text-center font-mono text-xl tracking-[0.45em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                autoFocus
                required
              />

              <Button type="submit" className="mt-6 w-full gap-2" size="lg" disabled={pending || otp.length !== 6}>
                {pending && <Spinner />}{pending ? 'Creating account…' : 'Create account'}
              </Button>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs">
                <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => setStep('details')}>
                  Change details
                </button>
                <button type="button" className="font-medium text-primary hover:underline" onClick={() => void requestCode()} disabled={pending}>
                  Send another code
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
