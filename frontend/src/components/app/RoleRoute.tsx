import { Navigate, Outlet } from 'react-router-dom';
import { roleHome } from '@/lib/roles';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';


export function RoleRoute({ allowed }: { allowed: UserRole[] }) {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;

  const assignedRoles = new Set([user.role, ...(user.roles ?? [])]);
  const allowedHere = allowed.some((role) => assignedRoles.has(role));
  return allowedHere ? <Outlet /> : <Navigate to={roleHome[user.role]} replace />;
}


export function WorkspaceHome() {
  const user = useAuthStore((state) => state.user);
  return user ? <Navigate to={roleHome[user.role]} replace /> : null;
}
