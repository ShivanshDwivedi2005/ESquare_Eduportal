import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/common/Loading';
import { invitationApi, type InvitationPreview } from '@/services/invitations';
import { authApi } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { apiErrorMessage } from '@/lib/apiError';
import { roleHome } from '@/lib/roles';
import { toast } from 'sonner';

export default function JoinPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('t') ?? '';
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const user = useAuthStore((state) => state.user);
  const initialized = useAuthStore((state) => state.initialized);
  const initialize = useAuthStore((state) => state.initialize);
  const setUser = useAuthStore((state) => state.setUser);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (!token) {
      setError('This invitation link is incomplete.');
      return;
    }
    invitationApi.validate(token).then(setPreview).catch((reason) => {
      setError(apiErrorMessage(reason, 'This invitation is invalid or expired.'));
    });
  }, [token]);

  const accept = async () => {
    setPending(true);
    try {
      await invitationApi.accept(token);
      const updatedUser = await authApi.restore();
      setUser(updatedUser);
      toast.success('Institution access added to your account');
      navigate(roleHome[updatedUser.role], { replace: true });
    } catch (reason) {
      toast.error(apiErrorMessage(reason, 'The invitation could not be accepted.'));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="surface-card w-full max-w-lg p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary"><Building2 className="h-6 w-6" /></div>
        {error ? (
          <><h1 className="mt-5 text-2xl font-bold">Invitation unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p><Link to="/" className="mt-6 inline-block text-sm font-medium text-primary hover:underline">Return home</Link></>
        ) : !preview || !initialized ? (
          <div className="mt-6 flex justify-center"><Spinner /></div>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold">Join {preview.institution.institutionName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">You were invited as {preview.targetRole ?? preview.invitationType.toLowerCase()} for {preview.recipient}.</p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" />The invitation is single-use and bound to your verified email.</div>
            {user ? (
              <Button className="mt-7 w-full gap-2" size="lg" disabled={pending} onClick={() => void accept()}>{pending && <Spinner />}{pending ? 'Accepting…' : 'Accept invitation'}</Button>
            ) : (
              <Link to="/login" state={{ from: `${location.pathname}${location.search}` }}><Button className="mt-7 w-full" size="lg">Sign in to accept</Button></Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
