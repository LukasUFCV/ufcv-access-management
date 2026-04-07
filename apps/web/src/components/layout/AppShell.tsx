import { Building2, ClipboardList, FileText, Home, Laptop, LockKeyhole, Network, Settings, ShieldCheck, Users } from 'lucide-react';
import { useMemo, useState, type PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '@/app/providers/AuthProvider';
import { NotificationBell, ThemeToggle } from '@/components/ui';

type NavItem = {
  to: string;
  label: string;
  icon: JSX.Element;
  permission?: string;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Tableau de bord', icon: <Home size={18} />, permission: 'dashboard:read' },
  { to: '/people', label: 'Annuaire', icon: <Users size={18} />, permission: 'people:read' },
  { to: '/organization', label: 'Organisation', icon: <Building2 size={18} />, permission: 'organization:read' },
  { to: '/assets/material', label: 'Materiel', icon: <Laptop size={18} />, permission: 'assets:read' },
  { to: '/resources/software', label: 'Acces logiciels', icon: <LockKeyhole size={18} />, permission: 'software:read' },
  { to: '/resources/information', label: 'Acces information', icon: <Network size={18} />, permission: 'information:read' },
  { to: '/documents', label: 'Documents', icon: <FileText size={18} />, permission: 'documents:read' },
  { to: '/workflows', label: 'Workflows', icon: <ClipboardList size={18} />, permission: 'workflow:read' },
  { to: '/audit', label: 'Audit', icon: <ShieldCheck size={18} />, permission: 'audit:read' },
  { to: '/admin', label: 'Administration', icon: <Settings size={18} />, permission: 'admin:read' },
];

export const AppShell = ({
  children,
  notificationCount,
}: PropsWithChildren<{ notificationCount: number }>) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const allowedNavItems = useMemo(
    () =>
      navItems.filter((item) =>
        item.permission ? user?.permissions.includes(item.permission) : true,
      ),
    [user?.permissions],
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div className="brand-block">
          <span className="brand-mark" />
          <div>
            <strong>Habilitations UFCV</strong>
            <small>Gestion interne des acces et engagements</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          {allowedNavItems.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setIsMenuOpen(false)}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink to="/me" onClick={() => setIsMenuOpen(false)}>
            <Users size={18} />
            <span>Mon espace</span>
          </NavLink>
        </nav>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button className="menu-button" type="button" onClick={() => setIsMenuOpen((value) => !value)}>
            Menu
          </button>
          <div className="topbar-title">
            <strong>{user?.displayName ?? 'Utilisateur'}</strong>
            <span>{user?.role.replaceAll('_', ' ')}</span>
          </div>
          <div className="topbar-actions">
            <NotificationBell count={notificationCount} />
            <ThemeToggle />
            <button type="button" className="secondary-button" onClick={() => void logout()}>
              Deconnexion
            </button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};
