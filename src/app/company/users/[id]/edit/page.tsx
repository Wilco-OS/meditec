'use client';

// Direkte Client-Komponente ohne Interface für die Parameter
// Diese Implementierung funktioniert auch mit Next.js 13 App Router

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
import { ArrowLeft, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'employee';
  active: boolean;
}

// Direkte Client-Komponente mit any-Typisierung für params, um Typkonflikte zu vermeiden
// In Next.js 13 App Router kann params für page.tsx manchmal spezielle Typen haben
export default function EditCompanyUserPage(props: any) {
  // ID aus den Parametern extrahieren, ohne starke Typisierung
  const userId = props.params?.id;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Formulardaten
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    active: true,
  });

  // Fehler pro Feld
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Nur Unternehmensadmins haben Zugriff
    if (status === 'authenticated') {
      if (session?.user?.role !== 'company_admin') {
        router.push('/');
        toast({
          title: "Zugriff verweigert",
          description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
          variant: "destructive",
        });
      } else {
        // Benutzerdaten laden
        fetchUserData();
      }
    }
  }, [status, session, router, userId]);

  // Benutzerdaten laden
  const fetchUserData = async () => {
    if (!userId) {
      router.push('/company/users');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Benutzer konnte nicht geladen werden');
      }
      
      const userData = await response.json();
      
      // Sicherstellen, dass der Benutzer zum Unternehmen des aktuellen Admins gehört
      if (userData.role !== 'employee' || userData.companyId !== session?.user?.companyId) {
        throw new Error('Sie haben keine Berechtigung, diesen Benutzer zu bearbeiten');
      }
      
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '',
        confirmPassword: '',
        active: userData.active !== undefined ? userData.active : true,
      });
    } catch (error: any) {
      console.error('Fehler beim Laden des Benutzers:', error);
      toast({
        title: "Fehler",
        description: error.message || "Der Benutzer konnte nicht geladen werden.",
        variant: "destructive",
      });
      router.push('/company/users');
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

  // Formular validieren
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
    
    // Passwort nur validieren, wenn es ausgefüllt wurde (bei Bearbeitung optional)
    if (formData.password) {
      if (formData.password.length < 8) {
        newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Formular absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !userId) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Nur geänderte Felder senden
    const userData: any = {
      name: formData.name,
      email: formData.email,
      active: formData.active,
    };
    
    // Passwort nur senden, wenn es eingegeben wurde
    if (formData.password) {
      userData.password = formData.password;
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Mitarbeiters');
      }
      
      toast({
        title: "Erfolg",
        description: "Der Mitarbeiter wurde erfolgreich aktualisiert.",
      });
      
      // Weiterleitung zur Benutzerübersicht
      router.push('/company/users');
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Mitarbeiters:', error);
      toast({
        title: "Fehler",
        description: error.message || "Der Mitarbeiter konnte nicht aktualisiert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'company_admin')) {
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
          <Link href="/company/users" className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Mitarbeiterübersicht
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mitarbeiter bearbeiten</h1>
        </div>

        {isLoading ? (
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <Skeleton className="h-8 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {Array(4).fill(0).map((_, index) => (
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
                <CardTitle>Mitarbeiterinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="z.B. Max Mustermann"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* E-Mail */}
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="max.mustermann@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>

                {/* Passwort (optional bei Bearbeitung) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Neues Passwort (optional)</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                    <p className="text-xs text-muted-foreground">
                      Lassen Sie dieses Feld leer, um das Passwort nicht zu ändern.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                      disabled={!formData.password}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                {/* Aktiv/Inaktiv */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="active">Mitarbeiter ist aktiv</Label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Link href="/company/users">
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
