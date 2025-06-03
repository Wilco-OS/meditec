'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Save, Plus, ArrowRight } from 'lucide-react';
import SurveyBlockEditor from '@/components/surveys/SurveyBlockEditor';
import CompanySelector from '@/components/surveys/CompanySelector';
import { ISurveyBlock } from '@/models/Survey';

export default function CreateSurveyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [survey, setSurvey] = useState({
    title: '',
    description: '',
    isAnonymous: true,
    blocks: [] as ISurveyBlock[],
    assignedCompanies: [] as string[],
  });
  
  // Einfache Formularvalidierung
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Prüfen, ob der Benutzer angemeldet ist
  useEffect(() => {
    if (status === 'authenticated') {
      if (session.user.role !== 'meditec_admin') {
        toast({
          title: 'Zugriff verweigert',
          description: 'Nur Meditec-Administratoren können neue Umfragen erstellen',
          variant: 'destructive',
        });
        router.push('/admin/dashboard');
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, session, router, toast]);

  // Bei Änderungen im Formular
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSurvey(prev => ({ ...prev, [name]: value }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Umgang mit Switch-Komponente
  const handleSwitchChange = (checked: boolean) => {
    setSurvey(prev => ({ ...prev, isAnonymous: checked }));
  };

  // Blöcke aktualisieren
  const handleBlocksChange = (blocks: ISurveyBlock[]) => {
    setSurvey(prev => ({ ...prev, blocks }));
  };

  // Zugewiesene Unternehmen aktualisieren
  const handleCompaniesChange = (companies: string[]) => {
    setSurvey(prev => ({ ...prev, assignedCompanies: companies }));
  };

  // Formular validieren
  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!survey.title.trim()) {
        newErrors.title = 'Der Titel ist erforderlich';
      }
    } else if (currentStep === 2) {
      if (survey.blocks.length === 0) {
        newErrors.blocks = 'Mindestens ein Block ist erforderlich';
      } else if (survey.blocks.some(block => block.questions.length === 0)) {
        newErrors.blocks = 'Jeder Block muss mindestens eine Frage enthalten';
      }
    } else if (currentStep === 3) {
      if (survey.assignedCompanies.length === 0) {
        newErrors.companies = 'Mindestens ein Unternehmen muss zugewiesen werden';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Zum nächsten Schritt
  const handleNextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Zum vorherigen Schritt
  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...survey,
          status: 'draft',
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Erstellen der Umfrage');
      }
      
      const data = await response.json();
      
      toast({
        title: 'Erfolg',
        description: 'Die Umfrage wurde erfolgreich erstellt',
      });
      
      // Zur Übersichtsseite weiterleiten
      router.push('/admin/surveys');
      
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message || 'Beim Erstellen der Umfrage ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prüfen, ob der Benutzer noch geladen wird
  if (status === 'loading') {
    return <div>Laden...</div>;
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/admin/surveys">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Neue Umfrage erstellen</h1>
          </div>
          
          <div className="text-sm text-gray-500">
            Schritt {currentStep} von 3
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Schritt 1: Grundlegende Informationen */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Grundlegende Informationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    name="title"
                    value={survey.title}
                    onChange={handleInputChange}
                    placeholder="Geben Sie hier den Titel der Umfrage ein"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={survey.description}
                    onChange={handleInputChange}
                    placeholder="Beschreiben Sie kurz den Zweck dieser Umfrage"
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isAnonymous"
                    checked={survey.isAnonymous}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="isAnonymous">Anonyme Umfrage</Label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={() => router.push('/admin/surveys')}>
                  Abbrechen
                </Button>
                <Button type="button" onClick={handleNextStep}>
                  Weiter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Schritt 2: Blöcke und Fragen */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Blöcke und Fragen</CardTitle>
              </CardHeader>
              <CardContent>
                <SurveyBlockEditor 
                  blocks={survey.blocks}
                  onChange={handleBlocksChange}
                />
                {errors.blocks && (
                  <p className="text-sm text-red-500 mt-4">{errors.blocks}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                <Button type="button" onClick={handleNextStep}>
                  Weiter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Schritt 3: Unternehmenszuweisung */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Unternehmenszuweisung</CardTitle>
              </CardHeader>
              <CardContent>
                <CompanySelector 
                  selectedCompanies={survey.assignedCompanies}
                  onChange={handleCompaniesChange}
                />
                {errors.companies && (
                  <p className="text-sm text-red-500 mt-4">{errors.companies}</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" type="button" onClick={handlePrevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Wird erstellt...' : 'Umfrage erstellen'}
                </Button>
              </CardFooter>
            </Card>
          )}
        </form>
      </div>
    </MainLayout>
  );
}
