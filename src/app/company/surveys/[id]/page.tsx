'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, CalendarIcon, User, Clock, Check, AlertTriangle, Mail, Upload, Download, UserPlus, Send, FileText, Users, Trash2 } from 'lucide-react';
import SurveyPreview from '@/components/surveys/SurveyPreview';
import MainLayout from '@/components/layout/MainLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

import { SurveyStatus } from '@/types/survey'; // Korrekter Import aus dem types-Verzeichnis
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Schnittstellen für die Einladungen und Teilnehmer
interface Invitation {
  _id: string;
  email: string;
  name: string;
  surveyId: string;
  companyId: string;
  invitationCode: string;
  status: 'pending' | 'completed' | 'expired';
  sentAt: string;
  completedAt?: string;
}

interface Participant {
  name: string;
  email: string;
  departmentId?: string;
}

interface Department {
  id: string;
  name: string;
  description?: string;
}

export default function SurveyDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;
  
  const [survey, setSurvey] = useState<any>(null);
  const [userResponse, setUserResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Zustand für Umfrageaktivierung
  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  
  // Zustand für Mitarbeitereinladungen
  const [activeTab, setActiveTab] = useState('overview');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [newParticipant, setNewParticipant] = useState<Participant>({ name: '', email: '', departmentId: 'none' });
  const [isInviting, setIsInviting] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [csvParticipants, setCsvParticipants] = useState<Participant[]>([]);
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string>('');

  // Abteilungen laden
  const fetchDepartments = async () => {
    if (!session) return;
    
    setIsLoadingDepartments(true);
    
    try {
      const response = await fetch('/api/company/departments');
      
      if (!response.ok) {
        console.error('Fehler beim Laden der Abteilungen:', response.statusText);
        return;
      }
      
      const data = await response.json();
      setDepartments(data.departments || []);
    } catch (error) {
      console.error('Fehler beim Laden der Abteilungen:', error);
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  // Umfrage und Benutzerantworten laden
  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Abteilungen laden, wenn der Tab auf Einladungen gestellt ist
      if (activeTab === 'invitations') {
        fetchDepartments();
      }
      
      const fetchData = async () => {
        try {
          console.log('Lade Umfragedaten für ID:', surveyId);
          
          // Umfragedaten abrufen
          const surveyResponse = await fetch(`/api/surveys/${surveyId}`);
          
          if (!surveyResponse.ok) {
            let errorMsg;
            try {
              const errorData = await surveyResponse.json();
              errorMsg = errorData.error || 'Unbekannter Fehler';
            } catch (e) {
              errorMsg = surveyResponse.status === 404 
                ? 'Umfrage nicht gefunden' 
                : surveyResponse.status === 403 
                  ? 'Keine Berechtigung zum Anzeigen dieser Umfrage' 
                  : 'Fehler beim Abrufen der Umfrage';
            }
            throw new Error(errorMsg);
          }
          
          const surveyData = await surveyResponse.json();
          console.log('Umfragedaten erfolgreich geladen:', surveyData.title);
          setSurvey(surveyData);
          
          // Prüfen, ob der Benutzer bereits an der Umfrage teilgenommen hat
          const userResponseData = await fetch(`/api/surveys/responses?surveyId=${surveyId}&userId=${session.user.id}`);
          
          if (userResponseData.ok) {
            const responseData = await userResponseData.json();
            if (responseData.responses && responseData.responses.length > 0) {
              setUserResponse(responseData.responses[0]);
              console.log('Benutzerantwort gefunden');
            } else {
              console.log('Keine Benutzerantwort gefunden');
            }
          }
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
    } else if (status !== 'loading') {
      setIsLoading(false);
      setError('Sie müssen angemeldet sein, um auf diese Seite zuzugreifen.');
    }
  }, [session, status, surveyId]);
  
  // Einladungen laden
  const fetchInvitations = async () => {
    if (!session || !surveyId) return;
    
    setIsLoadingInvitations(true);
    try {
      const response = await fetch(`/api/surveys/${surveyId}/invitations`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Einladungen');
      }
      
      const data = await response.json();
      setInvitations(data.invitations || []);
    } catch (error: any) {
      console.error('Fehler beim Laden der Einladungen:', error);
      toast({
        title: 'Fehler',
        description: 'Die Einladungsdaten konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingInvitations(false);
    }
  };
  
  // Einladungen laden, wenn die Registerkarte wechselt
  useEffect(() => {
    if (activeTab === 'invitations' && session) {
      fetchInvitations();
    }
  }, [activeTab, session, surveyId]);

  // Einzelnen Mitarbeiter einladen
  const handleInviteParticipant = async () => {
    // E-Mail-Adressformat überprüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!session || !surveyId || !newParticipant.name) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie einen Namen ein.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!newParticipant.email || !emailRegex.test(newParticipant.email)) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }
    
    // Bereite die Teilnehmerdaten vor - verarbeite den "none"-Wert für keine Abteilung
    const participantToInvite = {
      ...newParticipant,
      departmentId: newParticipant.departmentId === 'none' ? undefined : newParticipant.departmentId
    };
    
    setIsInviting(true);
    
    try {
      toast({
        title: 'Verarbeitung',
        description: 'Einladung wird gesendet...',
      });
      
      const response = await fetch(`/api/surveys/${surveyId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants: [participantToInvite],
          message: emailMessage,
        }),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Fehler beim Einladen des Teilnehmers');
      }
      
      toast({
        title: 'Erfolg',
        description: `${newParticipant.name} wurde erfolgreich zur Umfrage eingeladen. Eine E-Mail wurde versendet.`,
      });
      
      // Formular zurücksetzen und Einladungen neu laden
      setNewParticipant({ name: '', email: '' });
      setEmailMessage('');
      setShowInviteDialog(false);
      fetchInvitations();
    } catch (error: any) {
      console.error('Fehler beim Einladen des Teilnehmers:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Der Teilnehmer konnte nicht eingeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  // CSV-Datei verarbeiten
  const handleCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessingCsv(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');
      
      // Überprüfen, ob Header-Zeile vorhanden ist
      if (lines.length < 1) {
        toast({
          title: 'Fehler',
          description: 'Die CSV-Datei enthält keine gültigen Daten.',
          variant: 'destructive',
        });
        setIsProcessingCsv(false);
        return;
      }
      
      // Header-Zeile analysieren, um Spaltenindizes zu finden
      const header = lines[0].toLowerCase().split(',');
      const nameIndex = header.findIndex(col => col.trim() === 'name');
      const emailIndex = header.findIndex(col => col.trim() === 'email');
      const departmentIndex = header.findIndex(col => col.trim() === 'abteilung' || col.trim() === 'department');
      
      // Überprüfen, ob notwendige Spalten vorhanden sind
      if (nameIndex === -1 || emailIndex === -1) {
        toast({
          title: 'Fehler',
          description: 'Die CSV-Datei muss mindestens die Spalten "Name" und "Email" enthalten.',
          variant: 'destructive',
        });
        setIsProcessingCsv(false);
        return;
      }
      
      // Erstellen eines Maps für den Abteilungsnamen zu ID-Zuordnung
      const departmentNameToIdMap = new Map<string, string>();
      departments.forEach(dept => {
        departmentNameToIdMap.set(dept.name.toLowerCase(), dept.id);
      });
      
      // Header-Zeile überspringen und Teilnehmer extrahieren
      const participants: Participant[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',');
        if (values.length > Math.max(nameIndex, emailIndex)) {
          const name = values[nameIndex].trim();
          const email = values[emailIndex].trim();
          
          // Setze 'none' als Standardwert für die Abteilung
          const participant: Participant = { name, email, departmentId: 'none' };
          
          // Wenn Abteilungsspalte vorhanden ist und eine Abteilung angegeben wurde
          if (departmentIndex !== -1 && values.length > departmentIndex) {
            const departmentName = values[departmentIndex].trim();
            if (departmentName) {
              // Abteilungs-ID basierend auf Namen nachschlagen
              const departmentId = departmentNameToIdMap.get(departmentName.toLowerCase());
              if (departmentId) {
                participant.departmentId = departmentId;
              }
            }
          }
          
          if (name && email) {
            participants.push(participant);
          }
        }
      }
      
      setCsvParticipants(participants);
      setIsProcessingCsv(false);
    };

    reader.onerror = () => {
      toast({
        title: 'Fehler',
        description: 'Die CSV-Datei konnte nicht gelesen werden.',
        variant: 'destructive',
      });
      setIsProcessingCsv(false);
    };

    reader.readAsText(file);
  };

  // CSV-Teilnehmer einladen
  const handleInviteCsvParticipants = async () => {
    if (!session || !surveyId || !csvParticipants.length) {
      toast({
        title: 'Fehler',
        description: 'Keine gültigen Teilnehmer in der CSV-Datei gefunden.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsInviting(true);
    
    try {
      const response = await fetch(`/api/surveys/${surveyId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participants: csvParticipants,
          message: emailMessage,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Einladen der Teilnehmer');
      }
      
      toast({
        title: 'Erfolg',
        description: `${csvParticipants.length} Teilnehmer wurden erfolgreich zur Umfrage eingeladen.`,
      });
      
      // Zurücksetzen und Einladungen neu laden
      setCsvParticipants([]);
      if (csvFileRef.current) csvFileRef.current.value = '';
      fetchInvitations();
    } catch (error: any) {
      console.error('Fehler beim Einladen der Teilnehmer:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Die Teilnehmer konnten nicht eingeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };
  
  // Einladung löschen
  const handleDeleteInvitation = async (invitationId: string) => {
    if (!session || !surveyId) return;
    
    try {
      const response = await fetch(`/api/surveys/invitations/${invitationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Löschen der Einladung');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Die Einladung wurde erfolgreich gelöscht.',
      });
      
      // Einladungen neu laden
      fetchInvitations();
    } catch (error: any) {
      console.error('Fehler beim Löschen der Einladung:', error);
      toast({
        title: 'Fehler',
        description: 'Die Einladung konnte nicht gelöscht werden.',
        variant: 'destructive',
      });
    }
  };
  
  // Einladungen erneut senden
  const handleResendInvitation = async (invitationId: string) => {
    if (!session || !surveyId) return;
    
    try {
      const response = await fetch(`/api/surveys/invitations/${invitationId}/resend`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim erneuten Senden der Einladung');
      }
      
      toast({
        title: 'Erfolg',
        description: 'Die Einladung wurde erneut gesendet.',
      });
      
      // Einladungen neu laden
      fetchInvitations();
    } catch (error: any) {
      console.error('Fehler beim erneuten Senden der Einladung:', error);
      toast({
        title: 'Fehler',
        description: 'Die Einladung konnte nicht erneut gesendet werden.',
        variant: 'destructive',
      });
    }
  };
  
  // Muster-CSV herunterladen
  const handleDownloadCsvTemplate = () => {
    // Abteilungsinformationen zur CSV-Vorlage hinzufügen
    const departmentInfo = departments.length > 0 
      ? `\n\nVerfügbare Abteilungen:\n${departments.map(d => d.name).join(', ')}` 
      : '';
    
    const csvContent = 'Name,Email,Abteilung\nMax Mustermann,max@beispiel.de,""\nErika Musterfrau,erika@beispiel.de,""' + departmentInfo;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'teilnehmer_vorlage.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Umfrage aktivieren
  const handleActivateSurvey = async () => {
    setIsActivating(true);
    
    try {
      const response = await fetch(`/api/surveys/${surveyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: SurveyStatus.ACTIVE }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktivieren der Umfrage');
      }
      
      // Umfrage im lokalen State aktualisieren
      setSurvey({
        ...survey,
        status: SurveyStatus.ACTIVE
      });
      
      toast({
        title: 'Umfrage aktiviert',
        description: 'Die Umfrage wurde erfolgreich aktiviert und ist nun für Mitarbeiter sichtbar.',
      });
    } catch (error: any) {
      console.error('Fehler beim Aktivieren der Umfrage:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Die Umfrage konnte nicht aktiviert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsActivating(false);
      setIsActivateDialogOpen(false);
    }
  };

  // Umfrageantworten einreichen
  const handleSubmitSurvey = async (answers: Record<string, any>) => {
    if (!session) {
      toast({
        title: 'Fehler',
        description: 'Sie müssen angemeldet sein, um an der Umfrage teilzunehmen.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/surveys/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyId,
          answers,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Einreichen der Umfrage');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Erfolg',
        description: 'Vielen Dank für Ihre Teilnahme! Ihre Antworten wurden erfolgreich gespeichert.',
      });
      
      // Benutzerantwort setzen, um Mehrfacheinreichungen zu verhindern
      setUserResponse({
        _id: data.responseId,
        answers,
        completedAt: new Date().toISOString(),
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
  if (status === 'loading' || isLoading) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/company/surveys">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Fehler anzeigen
  if (error || !survey) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/company/surveys">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Fehler</h1>
          </div>
          <Card className="p-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-medium text-destructive mb-2">{error || 'Umfrage nicht gefunden'}</h2>
              <p className="text-muted-foreground mb-6">
                Die angeforderte Umfrage konnte nicht geladen werden oder steht nicht mehr zur Verfügung.
              </p>
              <Button asChild>
                <Link href="/company/surveys">Zurück zur Übersicht</Link>
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
            <Link href="/company/surveys">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">{survey.title}</h1>
        </div>
        
        {/* Tabs für Überblick und Einladungen */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Überblick
            </TabsTrigger>
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Teilnehmer
            </TabsTrigger>
          </TabsList>
          
          {/* Überblick-Tab */}
          <TabsContent value="overview" className="mt-4">
            {/* Aktivierungsbutton für freigegebene Umfragen */}
            {survey.status === SurveyStatus.SCHEDULED && (
              <Card className="mb-6 border-blue-500 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Diese Umfrage wurde für Ihr Unternehmen freigegeben</h3>
                      <p className="text-muted-foreground">Aktivieren Sie die Umfrage, um sie für Ihre Mitarbeiter zugänglich zu machen.</p>
                    </div>
                    <Button 
                      onClick={() => setIsActivateDialogOpen(true)} 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Wird aktiviert...
                        </>
                      ) : (
                        'Umfrage aktivieren'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Info-Box zu Umfrage */}
            {survey.status !== SurveyStatus.ACTIVE || userResponse ? (
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {userResponse ? (
                      <>
                        <Check className="h-6 w-6 text-green-500" />
                        <h3 className="text-lg font-medium text-green-500">Sie haben an dieser Umfrage bereits teilgenommen</h3>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-6 w-6 text-amber-500" />
                        <h3 className="text-lg font-medium text-amber-500">Diese Umfrage ist nicht mehr aktiv</h3>
                      </>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Erstellt am: {formatDate(survey.createdAt)}
                      </span>
                    </div>
                    {survey.startDate && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Start: {formatDate(survey.startDate)}
                        </span>
                      </div>
                    )}
                    {survey.endDate && (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Ende: {formatDate(survey.endDate)}
                        </span>
                      </div>
                    )}
                    {userResponse && userResponse.completedAt && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Teilgenommen am: {formatDate(userResponse.completedAt)}
                        </span>
                      </div>
                    )}
                    {survey.isAnonymous && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Anonyme Umfrage</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
            
            {/* Umfrage-Vorschau/Teilnahme */}
            <SurveyPreview 
              survey={survey} 
              readOnly={survey.status !== SurveyStatus.ACTIVE || !!userResponse}
              onSubmit={handleSubmitSurvey}
            />
          </TabsContent>
          
          {/* Teilnehmer-Tab */}
          <TabsContent value="invitations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Mitarbeiter zu dieser Umfrage einladen</CardTitle>
                <CardDescription>Laden Sie Mitarbeiter ein, um an dieser Umfrage teilzunehmen. Die Teilnehmer erhalten eine E-Mail mit einem eindeutigen Zugangslink.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-4">
                  {/* Aktionsbuttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setShowInviteDialog(true)} className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Mitarbeiter einladen
                    </Button>
                    
                    <div className="relative">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleCsvFileChange}
                        ref={csvFileRef}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        CSV hochladen
                      </Button>
                    </div>
                    
                    <Button variant="outline" onClick={handleDownloadCsvTemplate} className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      CSV-Vorlage
                    </Button>
                  </div>
                  
                  {/* CSV-Teilnehmer anzeigen, wenn vorhanden */}
                  {csvParticipants.length > 0 && (
                    <Card className="mt-4">
                      <CardHeader>
                        <CardTitle>CSV-Teilnehmer ({csvParticipants.length})</CardTitle>
                        <CardDescription>Die folgenden Teilnehmer wurden aus der CSV-Datei geladen.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>E-Mail</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {csvParticipants.map((participant, index) => (
                                <TableRow key={index}>
                                  <TableCell>{participant.name}</TableCell>
                                  <TableCell>{participant.email}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => {
                          setCsvParticipants([]);
                          if (csvFileRef.current) csvFileRef.current.value = '';
                        }}>
                          Abbrechen
                        </Button>
                        <Button 
                          onClick={handleInviteCsvParticipants}
                          disabled={isInviting || csvParticipants.length === 0}
                        >
                          {isInviting ? 'Wird gesendet...' : 'Einladungen senden'}
                        </Button>
                      </CardFooter>
                    </Card>
                  )}
                  
                  {/* Liste der Einladungen */}
                  <div className="mt-4">
                    <h3 className="text-lg font-medium mb-4">Gesendete Einladungen</h3>
                    {isLoadingInvitations ? (
                      <div className="py-4 flex justify-center">
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : invitations.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>E-Mail</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Gesendet am</TableHead>
                            <TableHead>Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {invitations.map((invitation) => (
                            <TableRow key={invitation._id}>
                              <TableCell>{invitation.name}</TableCell>
                              <TableCell>{invitation.email}</TableCell>
                              <TableCell>
                                {invitation.status === 'completed' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Abgeschlossen
                                  </span>
                                ) : invitation.status === 'expired' ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    Abgelaufen
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    Ausstehend
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(invitation.sentAt)}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleResendInvitation(invitation._id)}
                                    disabled={invitation.status === 'completed'}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => handleDeleteInvitation(invitation._id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-10 border rounded-lg bg-gray-50">
                        <Mail className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-gray-900">Keine Einladungen gesendet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Für diese Umfrage wurden noch keine Einladungen versendet.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Dialog für Einzeleinladung */}
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mitarbeiter einladen</DialogTitle>
              <DialogDescription>
                Geben Sie den Namen und die E-Mail-Adresse des Mitarbeiters ein, den Sie einladen möchten.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  placeholder="Max Mustermann" 
                  value={newParticipant.name}
                  onChange={(e) => setNewParticipant({...newParticipant, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="max@beispiel.de" 
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant({...newParticipant, email: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="department">Abteilung</Label>
                <Select
                  value={newParticipant.departmentId}
                  onValueChange={(value) => setNewParticipant({...newParticipant, departmentId: value})}
                >
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Abteilung auswählen (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Keine Abteilung --</SelectItem>
                    {isLoadingDepartments ? (
                      <div className="flex items-center justify-center py-2">
                        <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    ) : departments.length > 0 ? (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-2 text-sm text-muted-foreground">
                        Keine Abteilungen gefunden
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Persönliche Nachricht (optional)</Label>
                <Textarea 
                  id="message" 
                  placeholder="Bitte nehmen Sie an unserer Umfrage teil..." 
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>Abbrechen</Button>
              <Button 
                onClick={handleInviteParticipant} 
                disabled={isInviting || !newParticipant.name || !newParticipant.email}
              >
                {isInviting ? 'Wird gesendet...' : 'Einladung senden'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Aktivierungsdialog */}
      <AlertDialog open={isActivateDialogOpen} onOpenChange={setIsActivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Umfrage aktivieren</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diese Umfrage aktivieren möchten? Nach der Aktivierung ist die Umfrage für Ihre Mitarbeiter zugänglich und kann beantwortet werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActivating}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleActivateSurvey();
              }}
              disabled={isActivating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isActivating ? 'Wird aktiviert...' : 'Ja, Umfrage aktivieren'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </MainLayout>
  );
}
