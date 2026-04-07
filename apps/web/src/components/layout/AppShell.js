import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Building2, ClipboardList, FileText, Home, Laptop, LockKeyhole, Network, Settings, ShieldCheck, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { NotificationBell, ThemeToggle } from '@/components/ui';
const navItems = [
    { to: '/', label: 'Tableau de bord', icon: _jsx(Home, { size: 18 }), permission: 'dashboard:read' },
    { to: '/people', label: 'Annuaire', icon: _jsx(Users, { size: 18 }), permission: 'people:read' },
    { to: '/organization', label: 'Organisation', icon: _jsx(Building2, { size: 18 }), permission: 'organization:read' },
    { to: '/assets/material', label: 'Materiel', icon: _jsx(Laptop, { size: 18 }), permission: 'assets:read' },
    { to: '/resources/software', label: 'Acces logiciels', icon: _jsx(LockKeyhole, { size: 18 }), permission: 'software:read' },
    { to: '/resources/information', label: 'Acces information', icon: _jsx(Network, { size: 18 }), permission: 'information:read' },
    { to: '/documents', label: 'Documents', icon: _jsx(FileText, { size: 18 }), permission: 'documents:read' },
    { to: '/workflows', label: 'Workflows', icon: _jsx(ClipboardList, { size: 18 }), permission: 'workflow:read' },
    { to: '/audit', label: 'Audit', icon: _jsx(ShieldCheck, { size: 18 }), permission: 'audit:read' },
    { to: '/admin', label: 'Administration', icon: _jsx(Settings, { size: 18 }), permission: 'admin:read' },
];
export const AppShell = ({ children, notificationCount, }) => {
    const { user, logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const allowedNavItems = useMemo(() => navItems.filter((item) => item.permission ? user?.permissions.includes(item.permission) : true), [user?.permissions]);
    return (_jsxs("div", { className: "app-shell", children: [_jsxs("aside", { className: `sidebar ${isMenuOpen ? 'open' : ''}`, children: [_jsxs("div", { className: "brand-block", children: [_jsx("span", { className: "brand-mark" }), _jsxs("div", { children: [_jsx("strong", { children: "Habilitations UFCV" }), _jsx("small", { children: "Gestion interne des acces et engagements" })] })] }), _jsxs("nav", { className: "sidebar-nav", children: [allowedNavItems.map((item) => (_jsxs(NavLink, { to: item.to, onClick: () => setIsMenuOpen(false), children: [item.icon, _jsx("span", { children: item.label })] }, item.to))), _jsxs(NavLink, { to: "/me", onClick: () => setIsMenuOpen(false), children: [_jsx(Users, { size: 18 }), _jsx("span", { children: "Mon espace" })] })] })] }), _jsxs("div", { className: "shell-main", children: [_jsxs("header", { className: "topbar", children: [_jsx("button", { className: "menu-button", type: "button", onClick: () => setIsMenuOpen((value) => !value), children: "Menu" }), _jsxs("div", { className: "topbar-title", children: [_jsx("strong", { children: user?.displayName ?? 'Utilisateur' }), _jsx("span", { children: user?.role.replaceAll('_', ' ') })] }), _jsxs("div", { className: "topbar-actions", children: [_jsx(NotificationBell, { count: notificationCount }), _jsx(ThemeToggle, {}), _jsx("button", { type: "button", className: "secondary-button", onClick: () => void logout(), children: "Deconnexion" })] })] }), _jsx("main", { className: "page-content", children: children })] })] }));
};
