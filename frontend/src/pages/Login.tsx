import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { roleHome, roleLabel } from '@/lib/roles';
import type { UserRole } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Spinner } from '@/components/common/Loading';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const roles: UserRole[] = ['student', 'teacher', 'principal', 'admin', 'hr', 'finance', 'admission', 'organization', 'public'];

export default function LoginPage() {
  const [role, setRole] = useState<UserRole>('student');
  const [email, setEmail] = useState('demo.student@example.invalid');
  const [password, setPassword] = useState('esquare');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    window.setTimeout(() => {
      login(role);
      toast.success(`Signed in as ${roleLabel[role]}`);
      navigate(roleHome[role]);
    }, 900);
  };

  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      <div className="absolute right-4 top-4 z-10"><ThemeToggle /></div>
      <div className="flex flex-col justify-center px-6 py-12 md:px-16">
        <Link to="/" className="mb-10 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight">ESQUARE</span>
        </Link>

        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold">Sign in to your workspace</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose the role you want to explore. Every role opens a purpose-built workspace.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <Label className="mb-2 block">Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      'rounded-lg border px-2 py-2.5 text-xs font-medium transition-colors',
                      role === r
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-border text-muted-foreground hover:border-ring/40 hover:text-foreground',
                    )}
                  >
                    {roleLabel[r]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email or ESQUARE ID</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/login" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={pending}>
              {pending && <Spinner />}{pending ? 'Signing you in…' : 'Continue'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            New to ESQUARE? <Link to="/signup" className="font-medium text-primary hover:underline">Create an account</Link>
          </p>
        </div>
      </div>

      <aside className="hidden flex-col justify-center border-l border-border bg-surface-muted px-16 lg:flex">
        <ShieldCheck className="h-8 w-8 text-primary" />
        <blockquote className="mt-6 max-w-md text-xl font-medium leading-relaxed">
          “Attendance, marks, admissions, hiring and student work finally live in one verified record — we retired four
          separate tools.”
        </blockquote>
        <p className="mt-5 text-sm text-muted-foreground">Dr. S. Raghavan — Principal, Greenwood International School</p>
      </aside>
    </div>
  );
}
