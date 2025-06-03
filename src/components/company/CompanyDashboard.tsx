'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { Users, FileText, BarChart2, Mail } from 'lucide-react';

// Statistik-Karte Komponente
interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, color }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <div className={`${color} p-2 rounded-full`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </CardContent>
  </Card>
);

// Hauptkomponente für das Unternehmens-Dashboard
const CompanyDashboard = () => {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Daten vom Server laden
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/company/dashboard');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Fehler beim Laden der Daten');
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (err: any) {
        console.error('Fehler beim Laden der Dashboard-Daten:', err);
        setError(err.message || 'Ein unerwarteter Fehler ist aufgetreten');
      } finally {
        setIsLoading(false);
      }
    };

    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  // Ladezustand
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-2xl font-bold mb-6">Unternehmens-Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-200 h-32 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
            <div className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{dashboardData?.companyName || 'Unternehmens-Dashboard'}</h1>
            {dashboardData && (
              <p className="text-muted-foreground">{dashboardData.stats.employees.total} Mitarbeiter gesamt, {dashboardData.stats.employees.active} aktiv</p>
            )}
          </div>
          <div className="flex space-x-3">
            <Link href="/company/employees/invite">
              <Button>
                <Mail className="mr-2 h-4 w-4" />
                Mitarbeiter einladen
              </Button>
            </Link>
            <Link href="/company/surveys">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Umfragen verwalten
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Mitarbeiter"
            value={dashboardData?.stats?.employees?.total || 0}
            description={`${dashboardData?.stats?.employees?.active || 0} aktive Mitarbeiter`}
            icon={<Users className="h-4 w-4 text-white" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Abteilungen"
            value={dashboardData?.stats?.departments || 0}
            description="Firmen-Abteilungen"
            icon={<Users className="h-4 w-4 text-white" />}
            color="bg-indigo-500"
          />
          <StatCard
            title="Aktive Umfragen"
            value={dashboardData?.stats?.surveys?.active || 0}
            description="Derzeit laufende Umfragen"
            icon={<FileText className="h-4 w-4 text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="Abgeschlossene Umfragen"
            value={dashboardData?.stats?.surveys?.completed || 0}
            description="Insgesamt abgeschlossene Umfragen"
            icon={<FileText className="h-4 w-4 text-white" />}
            color="bg-purple-500"
          />
        </div>

        {/* Hauptinhalt des Dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aktuelle Umfragen */}
          <Card>
            <CardHeader>
              <CardTitle>Aktuelle Umfragen</CardTitle>
              <CardDescription>Status und Beteiligung der laufenden Umfragen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentActivity?.surveys && dashboardData.recentActivity.surveys.length > 0 ? (
                  dashboardData.recentActivity.surveys.map((survey: any) => (
                    <div key={survey.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <Link href={`/company/surveys/${survey.id}`} className="font-medium hover:underline">
                          {survey.title}
                        </Link>
                        <div className="text-sm text-muted-foreground mt-1">
                          Status: {survey.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          survey.status === 'active' ? 'bg-green-100 text-green-800' : 
                          survey.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {survey.status === 'active' ? 'Aktiv' : 
                           survey.status === 'draft' ? 'Entwurf' : 
                           'Abgeschlossen'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Keine aktiven Umfragen vorhanden</p>
                )}
              </div>
              <div className="mt-4">
                <Link href="/company/surveys">
                  <Button variant="outline" className="w-full">Alle Umfragen anzeigen</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Response-Raten */}
          <Card>
            <CardHeader>
              <CardTitle>Teilnahmestatistik</CardTitle>
              <CardDescription>Beteiligung an aktuellen und kürzlich abgeschlossenen Umfragen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.responseRates && dashboardData.responseRates.length > 0 ? (
                  dashboardData.responseRates.map((survey: any) => (
                    <div key={survey.surveyId} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <span className="font-medium">{survey.title}</span>
                        <div className="text-sm text-muted-foreground mt-1">
                          Teilnahme: {survey.responses} von {survey.eligible} Mitarbeitern
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          survey.responseRate > 75 ? 'bg-green-100 text-green-800' : 
                          survey.responseRate > 50 ? 'bg-blue-100 text-blue-800' : 
                          survey.responseRate > 25 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {survey.responseRate}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Keine Umfrage-Statistiken verfügbar</p>
                )}
              </div>
              <div className="mt-4">
                <Link href="/company/employees">
                  <Button variant="outline" className="w-full">Alle Mitarbeiter anzeigen</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default CompanyDashboard;
