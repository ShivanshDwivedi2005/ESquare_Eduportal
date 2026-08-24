import { beforeEach, describe, expect, it, vi } from 'vitest';

const { post } = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('@/services/api', () => ({ default: { post } }));

import { invitationApi } from '@/services/invitations';

describe('invitationApi', () => {
  beforeEach(() => post.mockReset());

  it('validates a token without placing it in the URL', async () => {
    post.mockResolvedValue({ data: { invitationType: 'STUDENT' } });
    await invitationApi.validate('single-use-token');
    expect(post).toHaveBeenCalledWith('/invitations/validate', {
      token: 'single-use-token',
    });
  });

  it('submits acceptance only through the authenticated API client', async () => {
    post.mockResolvedValue({ data: { status: 'CLAIMED' } });
    await invitationApi.accept('single-use-token');
    expect(post).toHaveBeenCalledWith('/invitations/accept', {
      token: 'single-use-token',
    });
  });
});
