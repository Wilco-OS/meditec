import React from 'react';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions, hasRole } from '@/lib/auth';
import CompanyDashboard from '@/components/company/CompanyDashboard';

export const metadata = {
  title: 'Unternehmens-Dashboard | Meditec Umfragen',
  description: 'Dashboard für Unternehmensadministratoren',
};

export default async function CompanyDashboardPage() {
  // Authentifizierungsstatus und Berechtigungen auf dem Server prüfen
  const session = await getServerSession(authOptions);
  
  // Wenn nicht angemeldet oder keine Company-Admin-Berechtigung, umleiten
  if (!session || !hasRole(session, 'company_admin')) {
    redirect('/auth/login');
  }
  
  return <CompanyDashboard />;
}
