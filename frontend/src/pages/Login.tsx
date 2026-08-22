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
import { apiErrorMessage } from '@/lib/apiError';


export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [pending, setPending] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const location = useLocation();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (pending) return;
    setPending(true);

    try {
      const user = await login(identifier, password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}`);
      const requestedPath = (location.state as { from?: string } | null)?.from;
      navigate(requestedPath || roleHome[user.role], { replace: true });
    } catch (error) {
      toast.error(apiErrorMessage(error, 'We could not sign you in. Try again.'));
    } finally {
      setPending(false);
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

          <form onSubmit={submit} className="mt-8 space-y-5">
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
