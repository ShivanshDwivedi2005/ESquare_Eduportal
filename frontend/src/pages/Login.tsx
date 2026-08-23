import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { roleHome } from '@/lib/roles';
import { toast } from 'sonner';
import { Spinner } from '@/components/common/Loading';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { apiErrorMessage } from '@/lib/apiError';
import type { GoogleAccountOption } from '@/services/auth';


export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [accountSelection, setAccountSelection] = useState<{
    token: string;
    accounts: GoogleAccountOption[];
  } | null>(null);
  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const selectGoogleAccount = useAuthStore((state) => state.selectGoogleAccount);
  const navigate = useNavigate();
  const location = useLocation();

  const finishLogin = (user: { name: string; role: keyof typeof roleHome }) => {
    toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
    const requestedPath = (location.state as { from?: string } | null)?.from;
    navigate(requestedPath || roleHome[user.role], { replace: true });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);

    try {
      const user = await login(identifier, password);
      finishLogin(user);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'We could not sign you in. Try again.'));
    } finally {
      setPending(false);
    }
  };

  const signInWithGoogle = async (credential: string) => {
    if (googlePending) return;
    setGooglePending(true);
    try {
      const result = await googleLogin(credential);
      if (result.status === 'authenticated') {
        finishLogin(result.user);
      } else if (result.status === 'signup_required') {
        toast.message('Create your ESQUARE username to continue');
        navigate('/signup', { state: { emailFromGoogle: result.email } });
      } else {
        setAccountSelection({ token: result.selectionToken, accounts: result.accounts });
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Google sign-in did not complete. Try again.'));
    } finally {
      setGooglePending(false);
    }
  };

  const chooseGoogleAccount = async (username: string) => {
    if (!accountSelection || googlePending) return;
    setGooglePending(true);
    try {
      const user = await selectGoogleAccount(accountSelection.token, username);
      finishLogin(user);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'That account could not be selected. Try Google sign-in again.'));
      setAccountSelection(null);
    } finally {
      setGooglePending(false);
    }
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.72fr)]">
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24">
        <Link to="/" className="mb-12 flex items-center gap-2.5 self-start">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">ESQUARE</span>
        </Link>

        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Use the same account everywhere. Your approved college roles will open automatically after sign-in.
          </p>

          <div className="mt-8">
            <GoogleSignInButton onCredential={(credential) => void signInWithGoogle(credential)} />
          </div>

          {accountSelection && (
            <div className="mt-5 rounded-xl border border-border bg-surface-muted p-4">
              <p className="text-sm font-semibold">Choose your ESQUARE account</p>
              <p className="mt-1 text-xs text-muted-foreground">This Google email belongs to more than one username.</p>
              <div className="mt-3 space-y-2">
                {accountSelection.accounts.map((account) => (
                  <button
                    key={account.public_id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft"
                    onClick={() => void chooseGoogleAccount(account.username)}
                    disabled={googlePending}
                  >
                    <span>
                      <span className="block text-sm font-medium">{account.display_name}</span>
                      <span className="block text-xs text-muted-foreground">@{account.username}</span>
                    </span>
                    {googlePending && <Spinner />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>or use your password</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or username</Label>
              <Input
                id="identifier"
                autoComplete="username"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="you@example.com or yourname"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-xs text-muted-foreground">Password recovery coming soon</span>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={pending}>
              {pending && <Spinner />}{pending ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            New to ESQUARE?{' '}
            <Link to="/signup" className="font-medium text-primary hover:underline">Create your account</Link>
          </p>
        </div>
      </div>

      <aside className="hidden border-l border-border bg-surface-muted px-12 lg:flex lg:flex-col lg:justify-center">
        <div className="max-w-md">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <h2 className="mt-5 text-xl font-semibold">One account, even when your role changes</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Start with a personal profile. When a verified institution adds you as a student, teacher, or staff member,
            the right workspace appears without creating another account.
          </p>
          <div className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
            Your password is never shared with an institution.
          </div>
        </div>
      </aside>
    </div>
  );
}
