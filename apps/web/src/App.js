import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/app/providers/AuthProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorState } from '@/components/ui';
import { api } from '@/lib/api';
import { AdminPage, AuditPage, DashboardPage, DocumentsPage, InformationPage, LoginPage, MaterialPage, MePage, NotificationsPage, OrganizationPage, PeoplePage, PersonDetailPage, SoftwarePage, WorkflowsPage, } from '@/features/pages';
import { useEffect, useState } from 'react';
const ProtectedLayout = () => {
    const { user, isLoading } = useAuth();
    const [notificationCount, setNotificationCount] = useState(0);
    useEffect(() => {
        if (!user) {
            return;
        }
        void api
            .get('/notifications')
            .then((response) => setNotificationCount(response.data.filter((item) => !item.isRead).length))
            .catch(() => setNotificationCount(0));
    }, [user]);
    if (isLoading) {
        return _jsx("div", { className: "page-loading", children: "Chargement de la session\u2026" });
    }
    if (!user) {
        return _jsx(Navigate, { to: "/login", replace: true });
    }
    return (_jsx(AppShell, { notificationCount: notificationCount, children: _jsx(Outlet, {}) }));
};
const AppRoutes = () => {
    const { user } = useAuth();
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: user ? _jsx(Navigate, { to: "/", replace: true }) : _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(ProtectedLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(DashboardPage, {}) }), _jsx(Route, { path: "people", element: _jsx(PeoplePage, {}) }), _jsx(Route, { path: "people/:id", element: _jsx(PersonDetailPage, {}) }), _jsx(Route, { path: "organization", element: _jsx(OrganizationPage, {}) }), _jsx(Route, { path: "assets/material", element: _jsx(MaterialPage, {}) }), _jsx(Route, { path: "resources/software", element: _jsx(SoftwarePage, {}) }), _jsx(Route, { path: "resources/information", element: _jsx(InformationPage, {}) }), _jsx(Route, { path: "documents", element: _jsx(DocumentsPage, {}) }), _jsx(Route, { path: "me", element: _jsx(MePage, {}) }), _jsx(Route, { path: "workflows", element: _jsx(WorkflowsPage, {}) }), _jsx(Route, { path: "admin", element: _jsx(AdminPage, {}) }), _jsx(Route, { path: "audit", element: _jsx(AuditPage, {}) }), _jsx(Route, { path: "notifications", element: _jsx(NotificationsPage, {}) })] }), _jsx(Route, { path: "*", element: _jsx(ErrorState, { message: "Page introuvable." }) })] }));
};
export const App = () => {
    return (_jsx(ThemeProvider, { children: _jsx(AuthProvider, { children: _jsx(Router, { children: _jsx(AppRoutes, {}) }) }) }));
};
