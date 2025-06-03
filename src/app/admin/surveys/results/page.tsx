'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import SurveyResults from '@/components/surveys/SurveyResults';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SurveyResultsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = searchParams.get('id') || '';
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [surveyTitle, setSurveyTitle] = useState('');

  // Umfragetitel abrufen
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!surveyId) {
      setError('Keine Umfrage-ID angegeben');
      setIsLoading(false);
      return;
    }

    const fetchSurveyTitle = async () => {
      try {
        const response = await fetch(`/api/surveys/${surveyId}`);
        
        if (!response.ok) {
          throw new Error(`Fehler beim Abrufen der Umfragedaten: ${response.status}`);
        }
        
        const data = await response.json();
        setSurveyTitle(data.title);
      } catch (err) {
        console.error('Fehler beim Laden der Umfragedaten:', err);
        setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurveyTitle();
  }, [session, status, router, surveyId]);

  // Lade-Anzeige
  if (status === 'loading' || isLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Lade Umfrageergebnisse...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Fehleranzeige
  if (error) {
    return (
      <div className="container py-10">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <Button variant="outline" asChild>
          <Link href="/admin/surveys">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{surveyTitle} - Ergebnisse</h1>
        <Button variant="outline" asChild>
          <Link href="/admin/surveys">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Übersicht
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardContent className="p-6">
          <SurveyResults surveyId={surveyId} />
        </CardContent>
      </Card>
    </div>
  );
}
