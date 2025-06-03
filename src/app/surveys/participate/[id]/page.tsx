'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CalendarIcon, User, Clock, Check, AlertTriangle } from 'lucide-react';
import SurveyPreview from '@/components/surveys/SurveyPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { SurveyStatus } from '@/types/survey';

export default function SurveyParticipationPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const surveyId = params.id as string;
  const invitationCode = searchParams.get('code');
  
  const [survey, setSurvey] = useState<any>(null);
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState(invitationCode || '');
  const [isVerifying, setIsVerifying] = useState(false);

  // Umfrage und Einladung laden, wenn ein Code bereitsteht
  useEffect(() => {
    if (surveyId && invitationCode) {
      verifyInvitationCode(invitationCode);
    } else {
      // Nur Umfragedaten laden, wenn kein Code vorhanden ist
      fetchSurveyData();
    }
  }, [surveyId, invitationCode]);

  // Umfragedaten abrufen
  const fetchSurveyData = async () => {
    try {
      const response = await fetch(`/api/surveys/public/${surveyId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Umfrage nicht gefunden');
        }
        throw new Error('Fehler beim Abrufen der Umfrage');
      }
      
      const data = await response.json();
      setSurvey(data);
    } catch (error: any) {
      console.error('Fehler beim Laden der Umfragedaten:', error);
      setError(error.message || 'Die Umfrage konnte nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  // Einladungscode verifizieren
  const verifyInvitationCode = async (code: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/surveys/verify-code?surveyId=${surveyId}&code=${code}`);
      
      if (!response.ok) {
        throw new Error('Ungültiger Einladungscode');
      }
      
      const data = await response.json();
      setInvitation(data.invitation);
      setSurvey(data.survey);
      
      // Erfolg anzeigen
      if (!invitationCode) { // Nur anzeigen, wenn manuell eingegeben
        toast({
          title: 'Code verifiziert',
          description: 'Der Einladungscode ist gültig. Sie können jetzt an der Umfrage teilnehmen.',
        });
      }
    } catch (error: any) {
      console.error('Fehler bei der Verifizierung des Codes:', error);
      setError(error.message || 'Der Einladungscode konnte nicht verifiziert werden');
      toast({
        title: 'Fehler',
        description: error.message || 'Der Einladungscode ist ungültig.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
      setIsLoading(false);
    }
  };

  // Code-Eingabe verarbeiten
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Einladungscode ein.',
        variant: 'destructive',
      });
      return;
    }
    
    verifyInvitationCode(codeInput.trim());
  };

  // Umfrageantworten einreichen
  const handleSubmitSurvey = async (answers: Record<string, any>) => {
    if (!invitation) {
      toast({
        title: 'Fehler',
        description: 'Sie benötigen einen gültigen Einladungscode, um an der Umfrage teilzunehmen.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/surveys/submit-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyId,
          invitationId: invitation._id,
          answers,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Einreichen der Umfrage');
      }
      
      const data = await response.json();
      
      // Einladung als abgeschlossen markieren
      setInvitation({
        ...invitation,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });
      
      toast({
        title: 'Erfolg',
        description: 'Vielen Dank für Ihre Teilnahme! Ihre Antworten wurden erfolgreich gespeichert.',
      });
    } catch (error: any) {
      console.error('Fehler beim Einreichen der Antworten:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Ihre Antworten konnten nicht gespeichert werden. Bitte versuchen Sie es später erneut.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatierungshilfsfunktion für Datum
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return format(new Date(dateString), 'dd. MMMM yyyy', { locale: de });
  };

  // Laden-Status anzeigen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container py-4">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück zur Startseite
            </Link>
          </div>
        </header>
        
        <main className="flex-grow container py-10">
          <Skeleton className="h-10 w-1/2 mb-6" />
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </main>
        
        <footer className="py-6 bg-gray-100">
          <div className="container text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Meditec Pulse Survey. Alle Rechte vorbehalten.
          </div>
        </footer>
      </div>
    );
  }

  // Fehler anzeigen
  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white shadow-sm">
          <div className="container py-4">
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Zurück zur Startseite
            </Link>
          </div>
        </header>
        
        <main className="flex-grow container py-10">
          <h1 className="text-3xl font-bold mb-6">Fehler</h1>
          
          <Card className="p-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-medium text-destructive mb-2">{error || 'Umfrage nicht gefunden'}</h2>
              <p className="text-muted-foreground mb-6">
                Die angeforderte Umfrage konnte nicht geladen werden oder steht nicht mehr zur Verfügung.
              </p>
              <Button asChild>
                <Link href="/">Zurück zur Startseite</Link>
              </Button>
            </div>
          </Card>
        </main>
        
        <footer className="py-6 bg-gray-100">
          <div className="container text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Meditec Pulse Survey. Alle Rechte vorbehalten.
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück zur Startseite
          </Link>
        </div>
      </header>
      
      <main className="flex-grow container py-10">
        <h1 className="text-3xl font-bold mb-6">{survey.title}</h1>
        
        {/* Einladungscode-Verifizierung, falls kein Code vorhanden ist */}
        {!invitation ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Einladungscode eingeben</CardTitle>
              <CardDescription>
                Um an dieser Umfrage teilzunehmen, benötigen Sie einen gültigen Einladungscode. 
                Dieser wurde Ihnen per E-Mail zugesendet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifyCode} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="invitationCode">Einladungscode</Label>
                  <Input 
                    id="invitationCode" 
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="z.B. A1B2C3D4"
                    className="w-full"
                  />
                </div>
                <Button type="submit" disabled={isVerifying}>
                  {isVerifying ? 'Wird verifiziert...' : 'Verifizieren'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* Info-Box für verifizierte Einladung */
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                {invitation.status === 'completed' ? (
                  <>
                    <Check className="h-6 w-6 text-green-500" />
                    <h3 className="text-lg font-medium text-green-500">
                      Sie haben an dieser Umfrage bereits teilgenommen
                    </h3>
                  </>
                ) : (
                  <>
                    <Check className="h-6 w-6 text-green-500" />
                    <h3 className="text-lg font-medium text-green-500">
                      Einladungscode verifiziert
                    </h3>
                  </>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Teilnehmer: {invitation.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Eingeladen am: {formatDate(invitation.sentAt)}
                  </span>
                </div>
                {invitation.completedAt && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Teilgenommen am: {formatDate(invitation.completedAt)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Umfrage-Vorschau/Teilnahme */}
        <SurveyPreview 
          survey={survey} 
          readOnly={survey.status !== SurveyStatus.ACTIVE || !invitation || invitation.status === 'completed'}
          onSubmit={handleSubmitSurvey}
        />
      </main>
      
      <footer className="py-6 bg-gray-100">
        <div className="container text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Meditec Pulse Survey. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
