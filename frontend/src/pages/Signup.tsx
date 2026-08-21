import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { roleHome, roleLabel } from '@/lib/roles';
import type { UserRole } from '@/types';
import { institutions } from '@/mock-data';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/common/ThemeToggle';

const accountTypes: { role: UserRole; blurb: string }[] = [
  { role: 'student', blurb: 'Coursework, projects, opportunities and a professional profile.' },
  { role: 'teacher', blurb: 'Class rosters, attendance, marks and materials.' },
  { role: 'admin', blurb: 'Institution administration, admissions, HR and finance.' },
  { role: 'organization', blurb: 'Post opportunities, run hackathons, hire students.' },
  { role: 'public', blurb: 'Browse institutions, opportunities and public work.' },
];

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(searchParams.get('role') === 'admin' ? 'admin' : 'student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState(institutions[0].id);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const needsInstitution = role === 'student' || role === 'teacher' || role === 'admin';

  const finish = () => {
    login(role);
    toast.success('Account created — welcome to ESQUARE');
    navigate(roleHome[role]);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-muted px-4 py-12">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-4.5 w-4.5" />
        </span>
        <span className="font-display text-lg font-extrabold tracking-tight">ESQUARE</span>
      </Link>

      <div className="surface-card w-full max-w-xl p-7">
        <div className="mb-6 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <span key={s} className={cn('h-1.5 flex-1 rounded-full', s <= step ? 'bg-primary' : 'bg-border')} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 className="text-xl font-bold">Choose your account type</h1>
            <p className="mt-1 text-sm text-muted-foreground">This determines your workspace and permissions.</p>
            <div className="mt-6 space-y-2.5">
              {accountTypes.map((t) => (
                <button
                  key={t.role}
                  onClick={() => setRole(t.role)}
                  className={cn(
                    'w-full rounded-xl border p-4 text-left transition-colors',
                    role === t.role ? 'border-primary bg-primary-soft' : 'border-border hover:border-ring/40',
                  )}
                >
                  <p className="font-display text-sm font-semibold">{roleLabel[t.role]}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t.blurb}</p>
                </button>
              ))}
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={() => setStep(2)}>Continue</Button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl font-bold">Tell us about you</h1>
            <p className="mt-1 text-sm text-muted-foreground">You can change these details later in settings.</p>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{role === 'organization' ? 'Organization name' : 'Full name'}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Rahul Verma" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@institution.edu" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input id="signup-password" type="password" placeholder="At least 8 characters" />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Continue</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-xl font-bold">{needsInstitution ? 'Connect your institution' : 'You are all set'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {needsInstitution
                ? 'Requests are reviewed by the institution administrator. You can browse in the meantime.'
                : 'Your workspace is ready. You can complete your profile any time.'}
            </p>
            {needsInstitution && (
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Select value={institution} onValueChange={setInstitution}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {institutions.map((i) => (
                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="enrolment">Enrolment / employee ID</Label>
                  <Input id="enrolment" placeholder="STU-2026-00482" />
                </div>
              </div>
            )}
            <div className="mt-6 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={finish}>Enter workspace</Button>
            </div>
          </>
        )}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
