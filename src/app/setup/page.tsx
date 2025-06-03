'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAdmins, setHasAdmins] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if there are any admin users
  useEffect(() => {
    const checkForAdmins = async () => {
      try {
        const response = await fetch('/api/setup/check');
        const data = await response.json();
        
        // If there are already admins, redirect to login
        if (data.hasAdmins) {
          setHasAdmins(true);
          toast({
            title: "Setup bereits abgeschlossen",
            description: "Es existieren bereits Admin-Benutzer. Bitte melden Sie sich an.",
            variant: "destructive",
          });
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Es gab ein Problem bei der Überprüfung des System-Status.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkForAdmins();
  }, [router, toast]);

  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear errors when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    } else if (!formData.email.endsWith('@meditec-online.com')) {
      newErrors.email = 'Nur E-Mail-Adressen der Domain meditec-online.com sind für die Ersteinrichtung erlaubt';
    }
    
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwörter stimmen nicht überein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/setup/init', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler bei der Ersteinrichtung');
      }
      
      toast({
        title: "Erfolg",
        description: "Admin-Benutzer wurde erfolgreich erstellt. Sie werden zur Anmeldeseite weitergeleitet.",
      });
      
      // Redirect to login
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
      
    } catch (error: any) {
      console.error('Fehler bei der Ersteinrichtung:', error);
      toast({
        title: "Fehler",
        description: error.message || "Die Ersteinrichtung konnte nicht abgeschlossen werden.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Systemstatus wird überprüft...</p>
        </div>
      </div>
    );
  }

  if (hasAdmins) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg max-w-md">
          <h1 className="text-xl font-bold mb-4">Ersteinrichtung bereits abgeschlossen</h1>
          <p className="mb-4">Es existieren bereits Admin-Benutzer im System. Sie werden zur Anmeldeseite weitergeleitet.</p>
          <Link href="/auth/login">
            <Button>Zur Anmeldeseite</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Ersteinrichtung</CardTitle>
          <CardDescription>
            Erstellen Sie den ersten Admin-Benutzer für Meditec Pulse Survey
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ihr Name"
                value={formData.name}
                onChange={handleChange}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@meditec-online.com"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              <p className="text-xs text-gray-500">
                Nur E-Mail-Adressen mit der Domain @meditec-online.com sind für die Ersteinrichtung zugelassen.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Passwort *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-red-500' : ''}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen *</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Link href="/">
              <Button variant="outline" type="button">Abbrechen</Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Einrichtung...
                </>
              ) : (
                'Einrichtung abschließen'
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
