'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import SurveyEditor from '@/components/surveys/SurveyEditor';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

export default function CreateSurveyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Unternehmensdaten laden
  useEffect(() => {
    if (session && session.user.role === 'meditec_admin') {
      const fetchCompanies = async () => {
        try {
          const response = await fetch('/api/companies');
          
          if (!response.ok) {
            throw new Error('Fehler beim Abrufen der Unternehmen');
          }
          
          const data = await response.json();
          setCompanies(data.companies || []);
        } catch (error) {
          console.error('Fehler beim Laden der Unternehmen:', error);
          toast({
            title: 'Hinweis',
            description: 'Unternehmensdaten konnten nicht geladen werden. Sie können die Umfrage erstellen, aber keine Unternehmen zuweisen.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCompanies();
    } else if (status === 'authenticated' && session?.user.role !== 'meditec_admin') {
      router.push('/dashboard');
    }
  }, [session, status]);

  // Laden-Status anzeigen
  if (status === 'loading' || (status === 'authenticated' && !session)) {
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
            <h1 className="text-3xl font-bold">Neue Umfrage erstellen</h1>
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
          <h1 className="text-3xl font-bold">Neue Umfrage erstellen</h1>
        </div>
        
        <Card className="p-6">
          <SurveyEditor companies={companies} />
        </Card>
      </div>
    </MainLayout>
  );
}
