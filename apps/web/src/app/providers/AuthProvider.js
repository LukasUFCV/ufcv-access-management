import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import { authApi } from '@/lib/api';
const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const refresh = useCallback(async () => {
        try {
            const me = await authApi.me();
            setUser(me);
        }
        catch {
            setUser(null);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        void refresh();
    }, [refresh]);
    const login = useCallback(async (login, password) => {
        const sessionUser = await authApi.login({ login, password });
        setUser(sessionUser);
    }, []);
    const logout = useCallback(async () => {
        await authApi.logout();
        setUser(null);
    }, []);
    const value = useMemo(() => ({
        user,
        isLoading,
        login,
        logout,
        refresh,
    }), [user, isLoading, login, logout, refresh]);
    return _jsx(AuthContext.Provider, { value: value, children: children });
};
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth doit être utilisé dans AuthProvider.');
    }
    return context;
};
