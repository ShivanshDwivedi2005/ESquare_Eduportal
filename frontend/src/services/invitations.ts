import api from '@/services/api';

export interface InvitationPreview {
  invitationType: 'ADMIN' | 'STUDENT' | 'TEACHER' | 'STAFF';
  recipient: string | null;
  institution: {
    institutionName: string;
    institutionType: string;
  };
  targetRole: string | null;
  expiresAt: string;
}

export const invitationApi = {
  async validate(token: string) {
    const { data } = await api.post<InvitationPreview>('/invitations/validate', { token });
    return data;
  },

  async accept(token: string) {
    const { data } = await api.post('/invitations/accept', { token });
    return data;
  },
};
