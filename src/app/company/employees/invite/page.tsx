'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Send, Loader2, UserPlus, UploadCloud, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Typen
interface Department {
  id: string;
  name: string;
}

export default function InviteEmployeePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvResults, setCsvResults] = useState<{success: number, errors: number}>({success: 0, errors: 0});
  const [isProcessingCsv, setIsProcessingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Formular-Status
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'employee',
    departmentId: '',
  });
  
  // Fehler-Status
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Departmentnamen-zu-ID-Mapping für CSV-Verarbeitung
  const departmentNameToIdMap = new Map<string, string>();
  
  // Lade verfügbare Abteilungen
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchDepartments();
    }
  }, [session, status]);
  
  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/company/departments');
      
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Abteilungen');
      }
      
      const data = await response.json();
      const depts = data.departments || [];
      setDepartments(depts);
      
      // Departmentnamen-zu-ID-Mapping für CSV-Verarbeitung aktualisieren
      depts.forEach((dept: Department) => {
        departmentNameToIdMap.set(dept.name.toLowerCase(), dept.id);
      });
    } catch (error) {
      console.error('Fehler beim Abrufen der Abteilungen:', error);
      toast({
        title: 'Fehler',
        description: 'Die Abteilungen konnten nicht geladen werden.',
        variant: 'destructive',
      });
    }
  };
  
  // CSV-Datei verarbeiten
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setCsvErrors([]);
      setCsvResults({ success: 0, errors: 0 });
    }
  };
  
  // CSV-Datei parsen und verarbeiten
  const processCsvFile = async () => {
    if (!csvFile) {
      toast({
        title: 'Fehler',
        description: 'Bitte wählen Sie eine CSV-Datei aus.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsProcessingCsv(true);
    setCsvErrors([]);
    
    try {
      const text = await csvFile.text();
      const rows = text.split('\n').filter(row => row.trim().length > 0);
      
      // CSV-Header überprüfen (erster Eintrag)
      const header = rows[0].split(',');
      const headerLower = header.map(h => h.trim().toLowerCase());
      
      const nameIndex = headerLower.indexOf('name');
      const emailIndex = headerLower.indexOf('email');
      const roleIndex = headerLower.indexOf('rolle');
      const departmentIndex = headerLower.indexOf('abteilung');
      
      if (nameIndex === -1 || emailIndex === -1) {
        throw new Error('CSV-Datei muss mindestens Spalten für "Name" und "Email" enthalten');
      }
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      // Jede Zeile verarbeiten (Erste Zeile überspringen, da es der Header ist)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(',');
        if (row.length < 2) continue; // Leere Zeilen überspringen
        
        const name = row[nameIndex]?.trim();
        const email = row[emailIndex]?.trim();
        const role = roleIndex !== -1 ? row[roleIndex]?.trim().toLowerCase() : 'employee';
        let departmentId = '';
        
        // Abteilungszuordnung basierend auf Name verarbeiten
        if (departmentIndex !== -1 && row[departmentIndex]?.trim()) {
          const departmentName = row[departmentIndex].trim().toLowerCase();
          departmentId = departmentNameToIdMap.get(departmentName) || '';
          
          if (!departmentId && departmentName !== '') {
            errors.push(`Zeile ${i+1}: Abteilung "${row[departmentIndex].trim()}" wurde nicht gefunden.`);
          }
        }
        
        if (!name || !email) {
          errors.push(`Zeile ${i+1}: Name und E-Mail sind erforderlich.`);
          errorCount++;
          continue;
        }
        
        // Validierung der E-Mail
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.push(`Zeile ${i+1}: Ungültiges E-Mail-Format "${email}".`);
          errorCount++;
          continue;
        }
        
        // Rolle validieren
        const validRole = role === 'employee' || role === 'company_admin' || role === 'admin';
        const finalRole = validRole ? role : 'employee';
        
        // Einladung senden
        try {
          const response = await fetch('/api/company/employees/invite', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name,
              email,
              role: finalRole,
              departmentId: departmentId || undefined,
            }),
          });
          
          if (!response.ok) {
            const data = await response.json();
            errors.push(`Zeile ${i+1}: ${data.error || 'Fehler beim Einladen'}.`);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error: any) {
          errors.push(`Zeile ${i+1}: ${error.message || 'Unbekannter Fehler'}.`);
          errorCount++;
        }
      }
      
      setCsvResults({ success: successCount, errors: errorCount });
      setCsvErrors(errors);
      
      if (successCount > 0) {
        toast({
          title: 'CSV-Import abgeschlossen',
          description: `${successCount} Einladungen erfolgreich versendet${errorCount > 0 ? `, ${errorCount} Fehler` : ''}.`,
        });
      } else if (errorCount > 0) {
        toast({
          title: 'CSV-Import fehlgeschlagen',
          description: `Es sind ${errorCount} Fehler aufgetreten.`,
          variant: 'destructive',
        });
      }
      
      // CSV-Datei zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setCsvFile(null);
      
    } catch (error: any) {
      console.error('Fehler bei der CSV-Verarbeitung:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Die CSV-Datei konnte nicht verarbeitet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingCsv(false);
    }
  };

  // Formular-Änderung
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Fehler löschen wenn Feld bearbeitet wird
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Select-Feld Änderung
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Fehler löschen wenn Feld bearbeitet wird
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  // Formular-Validierung
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/company/employees/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Fehler beim Einladen des Mitarbeiters');
      }
      
      toast({
        title: 'Erfolg',
        description: `Einladung an ${formData.email} wurde versendet.`,
      });
      
      // Zurück zur Mitarbeiterliste
      router.push('/company/employees');
    } catch (error: any) {
      console.error('Fehler beim Einladen des Mitarbeiters:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Der Mitarbeiter konnte nicht eingeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Zugriffskontrolle
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-10">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!session || session.user.role !== 'company_admin') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-10">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Zugriff verweigert</CardTitle>
              <CardDescription>
                Sie haben keine Berechtigung, auf diese Seite zuzugreifen.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button asChild variant="outline">
                <Link href="/company/dashboard">Zurück zum Dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Button variant="outline" asChild className="mb-6">
              <Link href="/company/employees">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Mitarbeiterliste
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold">Mitarbeiter einladen</h1>
            <p className="text-muted-foreground mt-1">
              Laden Sie neue Mitarbeiter zu Ihrem Unternehmen ein
            </p>
          </div>
          
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Einzelne Einladung</TabsTrigger>
              <TabsTrigger value="csv">CSV-Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <Card>
                <form onSubmit={handleSubmit}>
                  <CardHeader>
                    <CardTitle>Neue Einladung</CardTitle>
                    <CardDescription>
                      Der Mitarbeiter erhält eine E-Mail mit einem Link zur Registrierung.
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Max Mustermann"
                        value={formData.name}
                        onChange={handleChange}
                        className={errors.name ? 'border-red-500' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="max.mustermann@beispiel.de"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'border-red-500' : ''}
                        disabled={isSubmitting}
                      />
                      {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="role">Rolle</Label>
                      <Select 
                        disabled={isSubmitting}
                        value={formData.role}
                        onValueChange={(value) => handleSelectChange('role', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rolle auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Mitarbeiter</SelectItem>
                          <SelectItem value="company_admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                    </div>
                    
                    {departments.length > 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="departmentId">Abteilung</Label>
                        <Select
                          disabled={isSubmitting}
                          value={formData.departmentId}
                          onValueChange={(value) => handleSelectChange('departmentId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Abteilung auswählen (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- Keine Abteilung --</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" asChild>
                      <Link href="/company/employees">Abbrechen</Link>
                    </Button>
                    
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Einladung wird versendet...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Einladung senden
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
