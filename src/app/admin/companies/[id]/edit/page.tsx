'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Building, Loader2, Plus, X, Users } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type Department = {
  name: string;
  description?: string;
  _id?: string;
};

type Admin = {
  name: string;
  email: string;
  _id?: string;
};

interface Company {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone?: string;
  address?: string;
  city: string;
  postalCode?: string;
  country: string;
  active: boolean;
  departments?: Department[];
  admins?: Admin[];
}

export default function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Formulardaten
  const [formData, setFormData] = useState<Company>({
    _id: id,
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Deutschland',
    active: true,
    departments: [],
    admins: [],
  });

  // Fehler pro Feld
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Neue Abteilung
  const [newDepartment, setNewDepartment] = useState<Department>({
    name: '',
    description: ''
  });
  
  // Fehler für die Abteilungsverwaltung
  const [departmentError, setDepartmentError] = useState('');
  
  // Keine Administrator-Verwaltungsfunktionen mehr benötigt

  useEffect(() => {
    // Nur Meditec-Admins haben Zugriff
    if (status === 'authenticated') {
      if (session?.user?.role !== 'meditec_admin') {
        router.push('/');
        toast({
          title: "Zugriff verweigert",
          description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
          variant: "destructive",
        });
      } else {
        // Unternehmensdaten laden
        fetchCompanyData();
      }
    }
  }, [status, session, router, id]);

  // Unternehmensdaten laden
  const fetchCompanyData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/companies/${id}`);
      
      if (!response.ok) {
        throw new Error('Unternehmen konnte nicht geladen werden');
      }
      
      const companyData = await response.json();
      
      // Administratoren für das Unternehmen laden
      let admins = [];
      try {
        const adminsResponse = await fetch(`/api/companies/${id}/admins`);
        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json();
          admins = adminsData.admins || [];
        }
      } catch (error) {
        console.error('Fehler beim Laden der Administratoren:', error);
      }
      
      setFormData({
        _id: companyData._id,
        name: companyData.name || '',
        contactPerson: companyData.contactPerson || '',
        email: companyData.email || '',
        phone: companyData.phone || '',
        address: companyData.address || '',
        city: companyData.city || '',
        postalCode: companyData.postalCode || '',
        country: companyData.country || 'Deutschland',
        active: companyData.active !== undefined ? companyData.active : true,
        departments: companyData.departments || [],
        admins: admins,
      });
    } catch (error) {
      console.error('Fehler beim Laden des Unternehmens:', error);
      toast({
        title: "Fehler",
        description: "Das Unternehmen konnte nicht geladen werden.",
        variant: "destructive",
      });
      router.push('/admin/companies');
    } finally {
      setIsLoading(false);
    }
  };

  // Formularänderungen verarbeiten
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Fehler zurücksetzen, wenn Benutzer Feld ändert
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Switch-Änderungen verarbeiten
  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      active: checked,
    });
  };
  
  // Behandlung von Änderungen an der neuen Abteilung
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewDepartment({
      ...newDepartment,
      [name]: value
    });
    
    if (departmentError) {
      setDepartmentError('');
    }
  };
  
  // Hinzufügen einer neuen Abteilung
  const addDepartment = () => {
    if (!newDepartment.name.trim()) {
      setDepartmentError('Der Name der Abteilung ist erforderlich');
      return;
    }
    
    // Prüfen, ob bereits eine Abteilung mit diesem Namen existiert
    if (formData.departments?.some(dept => dept.name.toLowerCase() === newDepartment.name.toLowerCase())) {
      setDepartmentError('Eine Abteilung mit diesem Namen existiert bereits');
      return;
    }
    
    setFormData({
      ...formData,
      departments: [...(formData.departments || []), { ...newDepartment }]
    });
    
    // Formular zurücksetzen
    setNewDepartment({
      name: '',
      description: ''
    });
  };
  
  // Entfernen einer Abteilung
  const removeDepartment = (index: number) => {
    setFormData({
      ...formData,
      departments: formData.departments?.filter((_, i) => i !== index)
    });
  };
  
  // Administrator-Verwaltungsfunktionen wurden entfernt

  // Formular validieren
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Unternehmensname ist erforderlich';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'Stadt ist erforderlich';
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
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Unternehmens');
      }
      
      toast({
        title: "Erfolg",
        description: "Das Unternehmen wurde erfolgreich aktualisiert.",
      });
      
      // Weiterleitung zur Unternehmensübersicht
      router.push('/admin/companies');
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Unternehmens:', error);
      toast({
        title: "Fehler",
        description: error.message || "Das Unternehmen konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'meditec_admin')) {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="mb-6">
          <Link href="/admin/companies" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Unternehmensübersicht
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Unternehmen bearbeiten</h1>
        </div>

        {isLoading ? (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array(6).fill(0).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-36" />
            </CardFooter>
          </Card>
        ) : (
          <Card className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Unternehmensinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Unternehmensname */}
                <div className="space-y-2">
                  <Label htmlFor="name">Unternehmensname *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="z.B. Musterfirma GmbH"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Kontaktperson */}
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Ansprechpartner</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    placeholder="z.B. Max Mustermann"
                    value={formData.contactPerson}
                    onChange={handleChange}
                  />
                </div>

                {/* Kontaktdaten - E-Mail und Telefon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail-Adresse *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="kontakt@musterfirma.de"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+49 123 4567890"
                      value={formData.phone || ''}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    name="address"
                    placeholder="Straße und Hausnummer"
                    value={formData.address || ''}
                    onChange={handleChange}
                  />
                </div>

                {/* Ort, PLZ und Land */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Stadt *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="z.B. Berlin"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postleitzahl</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      placeholder="12345"
                      value={formData.postalCode || ''}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Land</Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="Deutschland"
                      value={formData.country}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Abteilungen */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Abteilungen</Label>
                  </div>
                  
                  <Separator />
                  
                  {/* Liste vorhandener Abteilungen */}
                  <div className="space-y-3">
                    {formData.departments && formData.departments.length > 0 ? (
                      <div className="space-y-2">
                        {formData.departments.map((dept, index) => (
                          <div key={dept._id || index} className="flex items-center justify-between p-2 border rounded-md">
                            <div>
                              <p className="font-medium">{dept.name}</p>
                              {dept.description && <p className="text-sm text-muted-foreground">{dept.description}</p>}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeDepartment(index)}
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Keine Abteilungen vorhanden.</p>
                    )}
                  </div>
                  
                  {/* Neue Abteilung hinzufügen */}
                  <div className="space-y-3 bg-gray-50 p-3 rounded-md">
                    <h4 className="text-sm font-medium">Neue Abteilung hinzufügen</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="departmentName">Name *</Label>
                      <Input
                        id="departmentName"
                        name="name"
                        value={newDepartment.name}
                        onChange={handleDepartmentChange}
                        placeholder="z.B. Vertrieb"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="departmentDescription">Beschreibung (optional)</Label>
                      <Textarea
                        id="departmentDescription"
                        name="description"
                        value={newDepartment.description || ''}
                        onChange={handleDepartmentChange}
                        placeholder="Kurze Beschreibung der Abteilung"
                      />
                    </div>
                    
                    {departmentError && <p className="text-sm text-red-500">{departmentError}</p>}
                    
                    <Button 
                      type="button" 
                      onClick={addDepartment} 
                      className="w-full" 
                      variant="outline"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Abteilung hinzufügen
                    </Button>
                  </div>
                </div>
                
                {/* Mitarbeiter/Admin-Verwaltung */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Mitarbeiter und Administratoren</Label>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Verwalten Sie Mitarbeiter und Administratoren über die Benutzerverwaltung.
                    </p>
                    
                    <Link 
                      href={`/admin/companies/${id}/users`} 
                      className="flex items-center space-x-2 text-primary hover:underline"
                    >
                      <Users className="h-4 w-4" />
                      <span>Zur Benutzerverwaltung</span>
                    </Link>
                  </div>
                </div>

                {/* Aktiv/Inaktiv */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="active">Unternehmen ist aktiv</Label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/admin/companies">
                  <Button variant="outline" type="button">Abbrechen</Button>
                </Link>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Änderungen speichern
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
