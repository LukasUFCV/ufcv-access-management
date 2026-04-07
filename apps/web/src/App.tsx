import { Navigate, Outlet, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import { AuthProvider, useAuth } from '@/app/providers/AuthProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorState } from '@/components/ui';
import { api } from '@/lib/api';
import {
  AdminPage,
  AuditPage,
  DashboardPage,
  DocumentsPage,
  InformationPage,
  LoginPage,
  MaterialPage,
  MePage,
  NotificationsPage,
  OrganizationPage,
  PeoplePage,
  PersonDetailPage,
  SoftwarePage,
  WorkflowsPage,
} from '@/features/pages';
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
      .then((response) =>
        setNotificationCount(
          (response.data as Array<{ isRead: boolean }>).filter((item) => !item.isRead).length,
        ),
      )
      .catch(() => setNotificationCount(0));
  }, [user]);

  if (isLoading) {
    return <div className="page-loading">Chargement de la session…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell notificationCount={notificationCount}>
      <Outlet />
    </AppShell>
  );
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="people" element={<PeoplePage />} />
        <Route path="people/:id" element={<PersonDetailPage />} />
        <Route path="organization" element={<OrganizationPage />} />
        <Route path="assets/material" element={<MaterialPage />} />
        <Route path="resources/software" element={<SoftwarePage />} />
        <Route path="resources/information" element={<InformationPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="me" element={<MePage />} />
        <Route path="workflows" element={<WorkflowsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<ErrorState message="Page introuvable." />} />
    </Routes>
  );
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};
