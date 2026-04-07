import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState, } from 'react';
const ThemeContext = createContext(null);
const storageKey = 'ufcv-theme-mode';
const getSystemTheme = () => {
    if (typeof window.matchMedia !== 'function') {
        return 'light';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};
export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const saved = window.localStorage.getItem(storageKey);
        return saved ?? 'system';
    });
    const [systemTheme, setSystemTheme] = useState(getSystemTheme);
    useEffect(() => {
        if (typeof window.matchMedia !== 'function') {
            return undefined;
        }
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => setSystemTheme(media.matches ? 'dark' : 'light');
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, []);
    const resolvedTheme = mode === 'system' ? systemTheme : mode;
    useEffect(() => {
        document.documentElement.dataset.theme = resolvedTheme;
        window.localStorage.setItem(storageKey, mode);
    }, [mode, resolvedTheme]);
    const value = useMemo(() => ({
        mode,
        resolvedTheme,
        setMode,
    }), [mode, resolvedTheme]);
    return _jsx(ThemeContext.Provider, { value: value, children: children });
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme doit être utilisé dans ThemeProvider.');
    }
    return context;
};
