import axios from 'axios';


export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.error?.message;
    if (typeof message === 'string') return message;
    const topLevelMessage = error.response?.data?.message;
    if (typeof topLevelMessage === 'string') return topLevelMessage;
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && typeof detail[0]?.msg === 'string') {
      return detail[0].msg.replace(/^Value error, /, '');
    }
  }
  return fallback;
}
