import api, { setAccessToken } from '@/services/api';
import type { User, UserRole } from '@/types';

type ApiMembership = {
  membershipId: string;
  status: string;
  institution: {
    institutionId: string;
    institutionCode: string;
    institutionName: string;
    status: string;
  };
  roles: string[];
};

type ApiUser = {
  userId: string;
  publicId: string;
  email: string;
  phone: string | null;
  status: string;
  emailVerifiedAt: string | null;
  profile: {
    firstName: string;
    middleName: string | null;
    lastName: string;
  } | null;
  memberships: ApiMembership[];
};

type AuthResponse = {
  accessToken: string;
  user: ApiUser;
};

const roleMap: Record<string, UserRole> = {
  ROOT_ADMIN: 'admin',
  ADMISSION_ADMIN: 'admission',
  FINANCE_ADMIN: 'finance',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  STUDENT: 'student',
  STAFF: 'hr',
};

const toUser = (user: ApiUser): User => {
  const membership = user.memberships[0];
  const roles = membership?.roles.map((role) => roleMap[role] ?? 'public') ?? [];
  const name = user.profile
    ? [user.profile.firstName, user.profile.middleName, user.profile.lastName].filter(Boolean).join(' ')
    : user.email.split('@')[0];
  return {
    id: user.userId,
    publicId: user.publicId,
    name,
    username: user.email.split('@')[0],
    email: user.email,
    role: roles[0] ?? 'public',
    roles,
    verified: Boolean(user.emailVerifiedAt),
    institutionId: membership?.institution.institutionId,
    institutionName: membership?.institution.institutionName,
    associationStatus: membership ? 'verified' : 'not_connected',
  };
};

const acceptAuth = (data: AuthResponse): User => {
  setAccessToken(data.accessToken);
  return toUser(data.user);
};

export const authApi = {
  async register(input: {
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    await api.post('/auth/register', input);
  },

  async verifyEmail(email: string, code: string) {
    await api.post('/auth/verify-email', { email, code });
  },

  async login(email: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    return acceptAuth(data);
  },

  async restore() {
    const { data } = await api.post<AuthResponse>('/auth/refresh');
    return acceptAuth(data);
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async forgotPassword(email: string) {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, password: string) {
    await api.post('/auth/reset-password', { token, password });
  },
};
