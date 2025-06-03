'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Filter } from 'lucide-react';
import SurveyList from '@/components/surveys/SurveyList';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';

// Statische Werte verwenden, um Probleme mit dem Import zu vermeiden
const SurveyStatusEnum = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SCHEDULED: 'scheduled',
  DRAFT: 'draft',
  ARCHIVED: 'archived',
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress'
} as const;

type SurveyStatusType = (typeof SurveyStatusEnum)[keyof typeof SurveyStatusEnum];

export default function CompanySurveysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SurveyStatusType>(SurveyStatusEnum.ACTIVE);

  // Umfragen abrufen
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchSurveys();
    }
  }, [session, status, activeTab]);

  // Umfragen abrufen mit Status-Filter
  const fetchSurveys = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/surveys?status=${activeTab}`);
      
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

  // Laden-Status anzeigen
  if (status === 'loading' || !session) {
    return (
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Verfügbare Umfragen</h1>
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

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Verfügbare Umfragen</h1>
            <p className="text-muted-foreground mt-1">
              Nehmen Sie an Pulsumfragen teil und teilen Sie Ihre Meinung mit
            </p>
          </div>
        </div>
        
        <Tabs 
          defaultValue={SurveyStatusEnum.ACTIVE} 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as SurveyStatusType)}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value={SurveyStatusEnum.ACTIVE}>Aktive Umfragen</TabsTrigger>
            <TabsTrigger value={SurveyStatusEnum.COMPLETED}>Abgeschlossene Umfragen</TabsTrigger>
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
              <>
                {surveys.length > 0 ? (
                  <SurveyList 
                    surveys={surveys}
                    isAdmin={false}
                  />
                ) : (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium mb-2">Keine Umfragen verfügbar</h3>
                      <p className="text-muted-foreground text-center max-w-md mb-4">
                        {activeTab === SurveyStatusEnum.ACTIVE 
                          ? 'Derzeit gibt es keine aktiven Umfragen für Ihr Unternehmen.' 
                          : 'Sie haben noch keine abgeschlossenen Umfragen.'}
                      </p>
                      {activeTab !== SurveyStatusEnum.ACTIVE && (
                        <Button variant="outline" onClick={() => setActiveTab(SurveyStatusEnum.ACTIVE)}>
                          Aktive Umfragen anzeigen
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
