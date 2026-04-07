import axios from 'axios';
export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1',
    withCredentials: true,
});
export const getErrorMessage = (error) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.message ?? error.message;
    }
    return 'Une erreur inattendue est survenue.';
};
export const authApi = {
    login: async (payload) => {
        const response = await api.post('/auth/login', payload);
        return response.data.user;
    },
    logout: async () => {
        await api.post('/auth/logout');
    },
    me: async () => {
        const response = await api.get('/auth/me');
        return response.data.user;
    },
};
