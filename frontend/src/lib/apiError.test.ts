import { describe, expect, it } from 'vitest';

import { apiErrorMessage } from './apiError';

describe('apiErrorMessage', () => {
  it('reads the current backend error envelope', () => {
    expect(
      apiErrorMessage(
        {
          isAxiosError: true,
          response: { data: { error: { message: 'Verify your email before signing in' } } },
        },
        'Fallback message',
      ),
    ).toBe('Verify your email before signing in');
  });

  it('keeps support for the legacy detail envelope', () => {
    expect(
      apiErrorMessage(
        { isAxiosError: true, response: { data: { detail: 'Legacy error' } } },
        'Fallback message',
      ),
    ).toBe('Legacy error');
  });

  it('shows rate-limit messages returned by Fastify', () => {
    expect(
      apiErrorMessage(
        { isAxiosError: true, response: { data: { message: 'Rate limit exceeded' } } },
        'Fallback message',
      ),
    ).toBe('Rate limit exceeded');
  });
});
