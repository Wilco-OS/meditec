'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import SurveyEditor from '@/components/surveys/SurveyEditor';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

export default function EditSurveyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const [survey, setSurvey] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Umfrage- und Unternehmensdaten laden
  useEffect(() => {
    if (session && session.user.role === 'meditec_admin' && params) {
      // Sicherstellen, dass params.id vorhanden und gültig ist
      const surveyId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      console.log('Lade Umfrage mit ID:', surveyId, 'Typ:', typeof surveyId);
      
      // Umfassendere ID-Validierung
      if (!surveyId || 
          surveyId === 'undefined' || 
          surveyId === 'null' || 
          surveyId.trim() === '' || 
          surveyId === '[object Object]') {
        console.error('Ungültige Umfrage-ID erkannt:', surveyId);
        setError('Die angeforderte Umfrage konnte nicht geladen werden.');
        setIsLoading(false);
        toast({
          title: 'Fehler',
          description: 'Ungültige Umfrage-ID. Bitte versuchen Sie es erneut oder wählen Sie eine Umfrage aus der Übersicht.',
          variant: 'destructive',
        });
        router.push('/admin/surveys'); // Automatisch zurück zur Übersicht leiten
        return;
      }
      
      const fetchData = async () => {
        try {
          console.log('Starte API-Aufruf für Umfrage-ID:', surveyId);
          
          // Umfragedaten abrufen
          const surveyResponse = await fetch(`/api/surveys/${surveyId}`);
          const responseData = await surveyResponse.json();
          
          if (!surveyResponse.ok) {
            console.error('API-Fehler beim Abrufen der Umfrage:', responseData);
            if (surveyResponse.status === 404) {
              throw new Error('Die angeforderte Umfrage wurde nicht gefunden');
            } else if (surveyResponse.status === 400) {
              throw new Error(responseData.error || 'Ungültige Anfrage');
            } else {
              throw new Error(responseData.error || 'Fehler beim Abrufen der Umfrage');
            }
          }
          
          console.log('Umfragedaten erfolgreich geladen:', responseData);
          
          // Detailliertere Debug-Logs
          console.log('Blocks:', responseData.blocks ? responseData.blocks.length : 'keine');
          console.log('Questions:', responseData.questions ? responseData.questions.length : 'keine');
          console.log('Erstes Block-Beispiel:', responseData.blocks && responseData.blocks.length > 0 ? responseData.blocks[0] : 'keins');
          console.log('Erste Frage-Beispiel:', responseData.questions && responseData.questions.length > 0 ? responseData.questions[0] : 'keins');
          console.log('AssignedCompanies:', responseData.assignedCompanies ? responseData.assignedCompanies.length : 'keine');
          
          setSurvey(responseData);
          
          // Unternehmensdaten abrufen
          const companiesResponse = await fetch('/api/companies');
          
          if (!companiesResponse.ok) {
            throw new Error('Fehler beim Abrufen der Unternehmen');
          }
          
          const companiesData = await companiesResponse.json();
          setCompanies(companiesData.companies || []);
        } catch (error: any) {
          console.error('Fehler beim Laden der Daten:', error);
          setError(error.message || 'Ein unbekannter Fehler ist aufgetreten');
          toast({
            title: 'Fehler',
            description: error.message || 'Die Daten konnten nicht geladen werden.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    } else if (status === 'authenticated' && session?.user.role !== 'meditec_admin') {
      router.push('/dashboard');
    }
  }, [session, status, params]);

  // Laden-Status anzeigen
  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/surveys">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Umfrage bearbeiten</h1>
          </div>
          <Card className="p-6">
            <Skeleton className="h-12 w-1/3 mb-4" />
            <Skeleton className="h-8 w-full mb-3" />
            <Skeleton className="h-8 w-full mb-3" />
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Benutzer ist nicht autorisiert
  if (status === 'authenticated' && session?.user.role !== 'meditec_admin') {
    router.push('/dashboard');
    return null;
  }

  // Fehler anzeigen
  if (error) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/surveys">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Fehler</h1>
          </div>
          <Card className="p-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-medium text-destructive mb-2">{error}</h2>
              <p className="text-muted-foreground mb-6">
                Die angeforderte Umfrage konnte nicht geladen werden.
              </p>
              <Button asChild>
                <Link href="/admin/surveys">Zurück zur Übersicht</Link>
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/surveys">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Umfrage bearbeiten: {survey.title}</h1>
        </div>
        
        <Card className="p-6">
          <SurveyEditor initialData={survey} companies={companies} />
        </Card>
      </div>
    </MainLayout>
  );
}
