import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshRequest: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthRequest = String(original?.url ?? '').includes('/auth/');

    if (error.response?.status === 401 && original && !original._retried && !isAuthRequest) {
      original._retried = true;
      try {
        refreshRequest ??= refreshClient
          .post('/auth/refresh')
          .then((response) => {
            const token = response.data.accessToken as string;
            setAccessToken(token);
            return token;
          })
          .finally(() => {
            refreshRequest = null;
          });
        const token = await refreshRequest;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        setAccessToken(null);
        window.dispatchEvent(new Event('esquare:session-ended'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
