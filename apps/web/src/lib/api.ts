import axios from 'axios';

export type ApiUser = {
  id: string;
  userId: string;
  personId: string | null;
  displayName: string;
  email: string;
  role: string;
  permissions: string[];
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
  withCredentials: true,
});

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }

  return 'Une erreur inattendue est survenue.';
};

export const authApi = {
  login: async (payload: { login: string; password: string }) => {
    const response = await api.post<{ user: ApiUser }>('/auth/login', payload);
    return response.data.user;
  },
  logout: async () => {
    await api.post('/auth/logout');
  },
  me: async () => {
    const response = await api.get<{ user: ApiUser }>('/auth/me');
    return response.data.user;
  },
};

