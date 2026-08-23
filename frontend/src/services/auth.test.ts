import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post, setAccessToken } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  setAccessToken: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  default: { get, post },
  setAccessToken,
}));

import { authApi } from '@/services/auth';


const apiUser = {
  id: '9f7dddbc-3354-4f55-a9ab-ae60877235ba',
  public_id: 'ESQ-9F7DDDBC3354',
  display_name: 'Aditi Sharma',
  username: 'aditi.sharma',
  email: 'aditi@example.com',
  email_verified: true,
  role: 'public',
  roles: [],
  association_status: 'not_connected' as const,
};


describe('authApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
    setAccessToken.mockReset();
  });

  it('maps the API account contract to the existing UI user model', async () => {
    post.mockResolvedValue({
      data: { access_token: 'access-token', token_type: 'bearer', user: apiUser },
    });

    const user = await authApi.login('ADITI.SHARMA', 'password123');

    expect(post).toHaveBeenCalledWith('/auth/login', {
      identifier: 'ADITI.SHARMA',
      password: 'password123',
    });
    expect(setAccessToken).toHaveBeenCalledWith('access-token');
    expect(user).toMatchObject({
      name: 'Aditi Sharma',
      publicId: 'ESQ-9F7DDDBC3354',
      username: 'aditi.sharma',
      role: 'public',
      verified: true,
    });
  });

  it('encodes usernames in availability requests', async () => {
    get.mockResolvedValue({ data: { username: 'aditi.sharma', available: true } });

    await authApi.checkUsername('aditi.sharma');

    expect(get).toHaveBeenCalledWith('/auth/usernames/aditi.sharma/availability');
  });

  it('returns an account chooser when a Google email has several usernames', async () => {
    post.mockResolvedValue({
      data: {
        status: 'account_selection_required',
        selection_token: 'short-lived-selection-token',
        accounts: [
          {
            public_id: 'ESQ-9F7DDDBC3354',
            display_name: 'Aditi Sharma',
            username: 'aditi.sharma',
          },
        ],
      },
    });

    const result = await authApi.googleLogin('google-id-token');

    expect(post).toHaveBeenCalledWith('/auth/google-login', { token: 'google-id-token' });
    expect(result).toMatchObject({
      status: 'account_selection_required',
      selectionToken: 'short-lived-selection-token',
    });
    expect(setAccessToken).not.toHaveBeenCalled();
  });

  it('accepts authentication after selecting a Google-linked username', async () => {
    post.mockResolvedValue({
      data: { access_token: 'access-token', token_type: 'bearer', user: apiUser },
    });

    const user = await authApi.selectGoogleAccount('selection-token', 'aditi.sharma');

    expect(post).toHaveBeenCalledWith('/auth/google-login/select', {
      selection_token: 'selection-token',
      username: 'aditi.sharma',
    });
    expect(setAccessToken).toHaveBeenCalledWith('access-token');
    expect(user.username).toBe('aditi.sharma');
  });
});
