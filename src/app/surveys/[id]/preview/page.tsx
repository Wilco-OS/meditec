'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import SurveyPreview from '@/components/surveys/SurveyPreview';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

export default function SurveyPreviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  
  const [survey, setSurvey] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Umfragedaten laden
  useEffect(() => {
    if (params && params.id) {
      // Sicherstellen, dass params.id vorhanden ist
      const surveyId = Array.isArray(params.id) ? params.id[0] : params.id;
      
      const fetchSurvey = async () => {
        try {
          setIsLoading(true);
          // Verwende den speziellen Preview-Endpunkt, der weniger strenge Berechtigungen hat
          const response = await fetch(`/api/surveys/${surveyId}/preview`);
          
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('Umfrage nicht gefunden');
            }
            throw new Error('Fehler beim Abrufen der Umfrage');
          }
          
          const data = await response.json();
          setSurvey(data);
        } catch (error: any) {
          console.error('Fehler beim Laden der Umfrage:', error);
          setError(error.message || 'Ein unbekannter Fehler ist aufgetreten');
          toast({
            title: 'Fehler',
            description: error.message || 'Die Umfrage konnte nicht geladen werden.',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchSurvey();
    } else {
      setError('Keine Umfrage-ID angegeben');
      setIsLoading(false);
    }
  }, [params]);

  // Rückgabe bei Ladefehler
  if (error) {
    return (
      <MainLayout>
        <div className="container py-10">
          <Link href={session?.user.role === 'meditec_admin' ? '/admin/surveys' : '/company/surveys'}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
          <Card className="p-6 text-center">
            <div className="text-red-500 mb-4">Fehler: {error}</div>
            <Button onClick={() => router.back()}>Zurück</Button>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Lade-Animation
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-10">
          <Link href={session?.user.role === 'meditec_admin' ? '/admin/surveys' : '/company/surveys'}>
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <Link href={session?.user.role === 'meditec_admin' ? '/admin/surveys' : '/company/surveys'}>
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
          
          {session?.user.role === 'meditec_admin' && (
            <Link href={`/admin/surveys/${params.id}/edit`}>
              <Button>Umfrage bearbeiten</Button>
            </Link>
          )}
        </div>
        
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-4">Vorschau: {survey?.title}</h1>
          <p className="text-gray-600 mb-6">{survey?.description}</p>
          
          {survey && <SurveyPreview survey={survey} readOnly={true} />}
        </Card>
      </div>
    </MainLayout>
  );
}
