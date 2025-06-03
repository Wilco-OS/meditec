'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, FileBarChart, Filter } from 'lucide-react';
import SurveyList from '@/components/surveys/SurveyList';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

import { SurveyStatus } from '@/types/survey';

export default function AdminSurveysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Umfragen abrufen
  useEffect(() => {
    if (session && session.user.role === 'meditec_admin') {
      fetchSurveys();
    } else if (status === 'authenticated' && session?.user.role !== 'meditec_admin') {
      router.push('/dashboard');
    }
  }, [session, status, activeTab]);

  // Umfragen abrufen mit Status-Filter
  const fetchSurveys = async () => {
    setIsLoading(true);
    
    try {
      const statusParam = activeTab !== 'all' ? `?status=${activeTab}` : '';
      const response = await fetch(`/api/surveys${statusParam}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Umfragen');
      }
      
      const data = await response.json();
      setSurveys(data.surveys || []);
    } catch (error) {
      console.error('Fehler beim Laden der Umfragen:', error);
      toast({
        title: 'Fehler',
        description: 'Die Umfragen konnten nicht geladen werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Umfrage löschen
  const handleDeleteSurvey = async (id: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Umfrage löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/surveys/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Umfrage');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Die Umfrage wurde erfolgreich gelöscht.',
      });
      
      // Liste aktualisieren
      fetchSurveys();
    } catch (error) {
      console.error('Fehler beim Löschen der Umfrage:', error);
      toast({
        title: 'Fehler',
        description: 'Die Umfrage konnte nicht gelöscht werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    }
  };

  // Umfrage duplizieren
  const handleDuplicateSurvey = async (id: string) => {
    try {
      // Original-Umfrage abrufen
      const response = await fetch(`/api/surveys/${id}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Umfrage');
      }
      
      const originalSurvey = await response.json();
      
      // Neue Umfrage mit denselben Daten erstellen (ohne ID)
      const { _id, createdAt, updatedAt, ...surveyData } = originalSurvey;
      
      // Titel für die Kopie anpassen
      const newSurveyData = {
        ...surveyData,
        title: `${surveyData.title} (Kopie)`,
        status: SurveyStatus.DRAFT
      };
      
      // Neue Umfrage erstellen
      const createResponse = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSurveyData),
      });
      
      if (!createResponse.ok) {
        throw new Error('Fehler beim Duplizieren der Umfrage');
      }
      
      const result = await createResponse.json();
      
      toast({
        title: 'Erfolg',
        description: 'Die Umfrage wurde erfolgreich dupliziert.',
      });
      
      // Liste aktualisieren
      fetchSurveys();
    } catch (error) {
      console.error('Fehler beim Duplizieren der Umfrage:', error);
      toast({
        title: 'Fehler',
        description: 'Die Umfrage konnte nicht dupliziert werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    }
  };

  // Status einer Umfrage ändern
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (!id || id === 'undefined') {
      toast({
        title: 'Fehler',
        description: 'Ungültige Umfrage-ID. Der Status konnte nicht aktualisiert werden.',
        variant: 'destructive',
      });
      return;
    }

    try {
      console.log(`Ändere Status der Umfrage ${id} zu ${newStatus}`);

      const response = await fetch(`/api/surveys/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('API Fehler:', responseData);
        throw new Error(responseData.error || 'Fehler beim Aktualisieren des Status');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Der Status der Umfrage wurde erfolgreich aktualisiert.',
      });
      
      // Liste aktualisieren
      setTimeout(() => fetchSurveys(), 500); // Kurze Verzögerung hinzufügen
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Status:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Der Status konnte nicht aktualisiert werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    }
  };

  // Laden-Status anzeigen
  if (status === 'loading' || (status === 'authenticated' && !session)) {
    return (
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Umfragen verwalten</h1>
          <div className="grid gap-6">
            {Array(3).fill(0).map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Benutzer ist nicht autorisiert
  if (status === 'authenticated' && session?.user.role !== 'meditec_admin') {
    router.push('/dashboard');
    return null;
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Umfragen verwalten</h1>
            <p className="text-muted-foreground mt-1">
              Erstellen und verwalten Sie Ihre Pulsumfragen für Unternehmen
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/admin/surveys/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Neue Umfrage
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/surveys/stats">
                <FileBarChart className="mr-2 h-4 w-4" />
                Statistiken
              </Link>
            </Button>
          </div>
        </div>
        
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="bg-muted">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value={SurveyStatus.DRAFT}>Entwürfe</TabsTrigger>
            <TabsTrigger value={SurveyStatus.PENDING}>Ausstehend</TabsTrigger>
            <TabsTrigger value={SurveyStatus.ACTIVE}>Aktiv</TabsTrigger>
            <TabsTrigger value={SurveyStatus.COMPLETED}>Abgeschlossen</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="pt-4">
            {isLoading ? (
              <div className="grid gap-6">
                {Array(3).fill(0).map((_, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/4 mt-2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <SurveyList 
                surveys={surveys}
                isAdmin={true}
                onDelete={handleDeleteSurvey}
                onDuplicate={handleDuplicateSurvey}
                onStatusChange={handleStatusChange}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
