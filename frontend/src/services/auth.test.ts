import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post, setAccessToken } = vi.hoisted(() => ({
  post: vi.fn(),
  setAccessToken: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  default: { post },
  setAccessToken,
}));

import { authApi } from '@/services/auth';

const apiUser = {
  userId: '9f7dddbc-3354-4f55-a9ab-ae60877235ba',
  publicId: 'ESQ-9F7DDDBC3354',
  email: 'aditi@example.com',
  phone: null,
  status: 'ACTIVE',
  emailVerifiedAt: '2026-08-25T00:00:00.000Z',
  profile: { firstName: 'Aditi', middleName: null, lastName: 'Sharma' },
  memberships: [
    {
      membershipId: '8a870c6d-95e4-4b5f-9bf1-0fef142f4f55',
      status: 'ACTIVE',
      institution: {
        institutionId: '43ba4471-2200-4eb5-ad82-b93e7351d7d5',
        institutionCode: 'ESQ-SCH-001',
        institutionName: 'Example School',
        status: 'ACTIVE',
      },
      roles: ['ADMISSION_ADMIN'],
    },
  ],
};

describe('authApi', () => {
  beforeEach(() => {
    post.mockReset();
    setAccessToken.mockReset();
  });

  it('maps the secure API account contract to the UI user model', async () => {
    post.mockResolvedValue({ data: { accessToken: 'access-token', user: apiUser } });

    const user = await authApi.login('aditi@example.com', 'Password12345');

    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'aditi@example.com',
      password: 'Password12345',
    });
    expect(setAccessToken).toHaveBeenCalledWith('access-token');
    expect(user).toMatchObject({
      name: 'Aditi Sharma',
      publicId: 'ESQ-9F7DDDBC3354',
      role: 'admission',
      institutionName: 'Example School',
      verified: true,
    });
  });

  it('sends registration fields without legacy usernames or role claims', async () => {
    post.mockResolvedValue({ data: { message: 'sent' } });
    await authApi.register({
      firstName: 'Aditi',
      lastName: 'Sharma',
      email: 'aditi@example.com',
      password: 'Password12345',
    });
    expect(post).toHaveBeenCalledWith('/auth/register', {
      firstName: 'Aditi',
      lastName: 'Sharma',
      email: 'aditi@example.com',
      password: 'Password12345',
    });
  });

  it('submits the email verification code to the versioned endpoint', async () => {
    post.mockResolvedValue({ data: { message: 'verified' } });
    await authApi.verifyEmail('aditi@example.com', '123456');
    expect(post).toHaveBeenCalledWith('/auth/verify-email', {
      email: 'aditi@example.com',
      code: '123456',
    });
  });
});
