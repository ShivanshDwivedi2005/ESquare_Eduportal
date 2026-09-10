import { beforeEach, describe, expect, it, vi } from 'vitest';

const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock('@/services/api', () => ({ default: { get, post } }));

import { institutionRequestsApi } from '@/services/institutionRequests';

describe('institutionRequestsApi', () => {
  beforeEach(() => {
    get.mockReset();
    post.mockReset();
  });

  it('loads boards and the signed-in user applications', async () => {
    get
      .mockResolvedValueOnce({ data: { items: [{ boardId: 'board-1', boardCode: 'CBSE', displayName: 'CBSE' }] } })
      .mockResolvedValueOnce({ data: { items: [], nextCursor: null } });

    await expect(institutionRequestsApi.listBoards()).resolves.toHaveLength(1);
    await expect(institutionRequestsApi.listMine()).resolves.toEqual([]);
    expect(get).toHaveBeenNthCalledWith(1, '/boards');
    expect(get).toHaveBeenNthCalledWith(2, '/institution-requests/me');
  });

  it('submits official school details to the authenticated endpoint', async () => {
    const input = {
      institutionName: 'Example School',
      institutionType: 'SCHOOL' as const,
      officialEmail: 'office@example.edu',
      officialPhone: '+919876543210',
      addressLine1: '1 School Road',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'IN',
    };
    post.mockResolvedValue({ data: { requestId: 'request-1', ...input, status: 'PENDING' } });

    await institutionRequestsApi.create(input);

    expect(post).toHaveBeenCalledWith('/institution-requests', input);
  });
});
