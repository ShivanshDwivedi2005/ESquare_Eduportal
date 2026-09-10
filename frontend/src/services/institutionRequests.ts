import api from '@/services/api';

export type InstitutionType = 'SCHOOL' | 'COLLEGE' | 'UNIVERSITY' | 'COACHING' | 'OTHER';
export type RegistrationRequestStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED';

export interface BoardOption {
  boardId: string;
  boardCode: string;
  displayName: string;
}

export interface InstitutionRegistrationRequest {
  requestId: string;
  institutionName: string;
  institutionType: InstitutionType;
  boardId: string | null;
  registrationNumber: string | null;
  officialEmail: string;
  officialPhone: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  status: RegistrationRequestStatus;
  reviewedAt: string | null;
  rejectionReason: string | null;
  approvedInstitutionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInstitutionRequestInput {
  institutionName: string;
  institutionType: InstitutionType;
  boardId?: string;
  registrationNumber?: string;
  officialEmail: string;
  officialPhone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const institutionRequestsApi = {
  async listBoards() {
    const { data } = await api.get<{ items: BoardOption[] }>('/boards');
    return data.items;
  },

  async listMine() {
    const { data } = await api.get<{
      items: InstitutionRegistrationRequest[];
      nextCursor: string | null;
    }>('/institution-requests/me');
    return data.items;
  },

  async create(input: CreateInstitutionRequestInput) {
    const { data } = await api.post<InstitutionRegistrationRequest>(
      '/institution-requests',
      input,
    );
    return data;
  },
};
