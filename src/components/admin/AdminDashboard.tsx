'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { Building, BarChart2, Users, FileText, Clock } from 'lucide-react';

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

// Hauptkomponente für das Admin-Dashboard
const AdminDashboard = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    companies: 0,
    activeCompanies: 0,
    surveys: 0,
    activeSurveys: 0,
    responses: 0,
    users: 0
  });
  const [recentSurveys, setRecentSurveys] = useState<any[]>([]);
  const [recentCompanies, setRecentCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Daten vom Server laden
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // API-Endpunkte für echte Daten aufrufen
        const statsResponse = await fetch('/api/admin/stats');
        const surveysResponse = await fetch('/api/admin/surveys/recent');
        const companiesResponse = await fetch('/api/admin/companies/recent');

        // Statistik-Daten verarbeiten
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData);
        } else {
          console.error('Fehler beim Abrufen der Statistiken:', await statsResponse.text());
        }

        // Umfrage-Daten verarbeiten
        if (surveysResponse.ok) {
          const surveysData = await surveysResponse.json();
          setRecentSurveys(surveysData.surveys || []);
        } else {
          console.error('Fehler beim Abrufen der neuesten Umfragen:', await surveysResponse.text());
        }

        // Unternehmens-Daten verarbeiten
        if (companiesResponse.ok) {
          const companiesData = await companiesResponse.json();
          setRecentCompanies(companiesData.companies || []);
        } else {
          console.error('Fehler beim Abrufen der neuesten Unternehmen:', await companiesResponse.text());
        }
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error);
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
          <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="bg-gray-200 h-32 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex space-x-3">
            <Link href="/admin/surveys/new">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                Neue Umfrage
              </Button>
            </Link>
            <Link href="/admin/companies/create">
              <Button variant="outline">
                <Building className="mr-2 h-4 w-4" />
                Neues Unternehmen
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="secondary">
                <BarChart2 className="mr-2 h-4 w-4" />
                Demo-Auswertung
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistik-Karten */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Unternehmen"
            value={stats.companies}
            description={`${stats.activeCompanies} aktive Unternehmen`}
            icon={<Building className="h-4 w-4 text-white" />}
            color="bg-blue-500"
          />
          <StatCard
            title="Umfragen"
            value={stats.surveys}
            description={`${stats.activeSurveys} aktive Umfragen`}
            icon={<FileText className="h-4 w-4 text-white" />}
            color="bg-green-500"
          />
          <StatCard
            title="Antworten"
            value={stats.responses}
            description="Gesamte Umfrageantworten"
            icon={<BarChart2 className="h-4 w-4 text-white" />}
            color="bg-purple-500"
          />
          <StatCard
            title="Benutzer"
            value={stats.users}
            description="Registrierte Benutzer"
            icon={<Users className="h-4 w-4 text-white" />}
            color="bg-orange-500"
          />
        </div>

        {/* Hauptinhalt des Dashboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Neueste Umfragen */}
          <Card>
            <CardHeader>
              <CardTitle>Neueste Umfragen</CardTitle>
              <CardDescription>Die zuletzt erstellten Umfragen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSurveys.length > 0 ? (
                  recentSurveys.map((survey) => (
                    <div key={survey.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <Link href={`/admin/surveys/${survey.id}`} className="font-medium hover:underline">
                          {survey.title}
                        </Link>
                        <div className="text-sm text-muted-foreground flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(survey.createdAt).toLocaleDateString('de-DE')}
                        </div>
                      </div>
                      <div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          survey.status === 'active' ? 'bg-green-100 text-green-800' : 
                          survey.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                          survey.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' : 
                          survey.status === 'completed' ? 'bg-blue-100 text-blue-800' : 
                          survey.status === 'pending' ? 'bg-orange-100 text-orange-800' : 
                          survey.status === 'in_progress' ? 'bg-indigo-100 text-indigo-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {survey.status === 'active' ? 'Aktiv' : 
                           survey.status === 'draft' ? 'Entwurf' : 
                           survey.status === 'scheduled' ? 'Geplant' : 
                           survey.status === 'completed' ? 'Abgeschlossen' : 
                           survey.status === 'pending' ? 'Ausstehend' : 
                           survey.status === 'in_progress' ? 'In Bearbeitung' : 
                           survey.status === 'archived' ? 'Archiviert' : 
                           survey.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Keine Umfragen vorhanden</p>
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/surveys">
                  <Button variant="outline" className="w-full">Alle Umfragen anzeigen</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Neueste Unternehmen */}
          <Card>
            <CardHeader>
              <CardTitle>Neueste Unternehmen</CardTitle>
              <CardDescription>Die zuletzt hinzugefügten Unternehmen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentCompanies.length > 0 ? (
                  recentCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between border-b pb-3">
                      <div>
                        <Link href={`/admin/companies/${company.id}`} className="font-medium hover:underline">
                          {company.name}
                        </Link>
                        <div className="text-sm text-muted-foreground mt-1">
                          {company.city || 'Keine Ortsangabe'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(company.createdAt).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Keine Unternehmen vorhanden</p>
                )}
              </div>
              <div className="mt-4">
                <Link href="/admin/companies">
                  <Button variant="outline" className="w-full">Alle Unternehmen anzeigen</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;
