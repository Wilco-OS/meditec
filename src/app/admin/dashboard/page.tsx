import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions, hasRole } from '@/lib/auth';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Admin Dashboard | Meditec Umfragen',
  description: 'Administrationsoberfläche für Meditec Umfragen',
};

export default async function AdminDashboardPage() {
  // Authentifizierungsstatus und Berechtigungen auf dem Server prüfen
  const session = await getServerSession(authOptions);
  
  // Wenn nicht angemeldet oder keine Admin-Berechtigung, umleiten
  if (!session || !hasRole(session, 'meditec_admin')) {
    redirect('/auth/login');
  }
  
  return <AdminDashboard />;
}
