import api, { setAccessToken } from '@/services/api';
import type { User, UserRole } from '@/types';

type ApiUser = {
  id: string;
  public_id: string;
  display_name: string;
  username: string;
  email: string;
  email_verified: boolean;
  role: string;
  roles: string[];
  association_status: User['associationStatus'];
};

type AuthResponse = {
  access_token: string;
  token_type: 'bearer';
  user: ApiUser;
};

export type GoogleAccountOption = {
  public_id: string;
  display_name: string;
  username: string;
};

type GoogleBackendResponse = AuthResponse | {
  status: 'account_selection_required';
  selection_token: string;
  accounts: GoogleAccountOption[];
} | {
  status: 'signup_required';
  email: string;
};

export type GoogleLoginResult =
  | { status: 'authenticated'; user: User }
  | { status: 'account_selection_required'; selectionToken: string; accounts: GoogleAccountOption[] }
  | { status: 'signup_required'; email: string };

const knownRoles: UserRole[] = [
  'student', 'teacher', 'principal', 'admin', 'hr', 'finance',
  'admission', 'organization', 'public',
];

const toRole = (role: string): UserRole =>
  knownRoles.includes(role as UserRole) ? (role as UserRole) : 'public';

const toUser = (user: ApiUser): User => ({
  id: user.id,
  publicId: user.public_id,
  name: user.display_name,
  username: user.username,
  email: user.email,
  role: toRole(user.role),
  roles: user.roles.map(toRole),
  verified: user.email_verified,
  associationStatus: user.association_status,
});

const acceptAuth = (data: AuthResponse): User => {
  setAccessToken(data.access_token);
  return toUser(data.user);
};

export const authApi = {
  async checkUsername(username: string) {
    const { data } = await api.get<{ username: string; available: boolean }>(
      `/auth/usernames/${encodeURIComponent(username)}/availability`,
    );
    return data;
  },

  async sendOtp(email: string) {
    await api.post('/auth/send-otp', { email });
  },

  async verifyOtp(email: string, otp: string) {
    const { data } = await api.post<{ verification_token: string }>('/auth/verify-otp', { email, otp });
    return data.verification_token;
  },

  async signup(input: {
    displayName: string;
    username: string;
    email: string;
    password: string;
    verificationToken: string;
  }) {
    const { data } = await api.post<AuthResponse>('/auth/signup', {
      display_name: input.displayName,
      username: input.username,
      email: input.email,
      password: input.password,
      verification_token: input.verificationToken,
    });
    return acceptAuth(data);
  },

  async login(identifier: string, password: string) {
    const { data } = await api.post<AuthResponse>('/auth/login', { identifier, password });
    return acceptAuth(data);
  },

  async googleLogin(token: string): Promise<GoogleLoginResult> {
    const { data } = await api.post<GoogleBackendResponse>('/auth/google-login', { token });
    if ('access_token' in data) {
      return { status: 'authenticated', user: acceptAuth(data) };
    }
    if (data.status === 'account_selection_required') {
      return {
        status: data.status,
        selectionToken: data.selection_token,
        accounts: data.accounts,
      };
    }
    return data;
  },

  async selectGoogleAccount(selectionToken: string, username: string) {
    const { data } = await api.post<AuthResponse>('/auth/google-login/select', {
      selection_token: selectionToken,
      username,
    });
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
};
