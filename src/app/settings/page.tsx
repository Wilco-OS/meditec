'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, Mail, Key, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface ProfileForm {
  name: string;
  email: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [profileForm, setProfileForm] = useState<ProfileForm>({
    name: '',
    email: '',
  });

  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [emailChangeRequested, setEmailChangeRequested] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [profileErrors, setProfileErrors] = useState({ name: '', email: '' });
  const [passwordErrors, setPasswordErrors] = useState({ 
    currentPassword: '', 
    newPassword: '', 
    confirmPassword: '', 
    general: '' 
  });

  // Benutzerdaten laden
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setProfileForm({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, session, router]);

  // Profilformular validieren
  const validateProfileForm = () => {
    const errors = { name: '', email: '' };
    let isValid = true;

    if (!profileForm.name.trim()) {
      errors.name = 'Name ist erforderlich';
      isValid = false;
    }

    if (!profileForm.email.trim()) {
      errors.email = 'E-Mail ist erforderlich';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      errors.email = 'Bitte geben Sie eine gültige E-Mail-Adresse ein';
      isValid = false;
    }

    setProfileErrors(errors);
    return isValid;
  };

  // Passwortformular validieren
  const validatePasswordForm = () => {
    const errors = { 
      currentPassword: '', 
      newPassword: '', 
      confirmPassword: '', 
      general: '' 
    };
    let isValid = true;

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Aktuelles Passwort ist erforderlich';
      isValid = false;
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Neues Passwort ist erforderlich';
      isValid = false;
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Das Passwort muss mindestens 8 Zeichen lang sein';
      isValid = false;
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwort bestätigen ist erforderlich';
      isValid = false;
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwörter stimmen nicht überein';
      isValid = false;
    }

    setPasswordErrors(errors);
    return isValid;
  };

  // Profil aktualisieren
  const updateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name,
          email: profileForm.email !== session?.user.email ? profileForm.email : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Aktualisieren des Profils');
      }

      // Überprüfen, ob eine E-Mail-Änderung angefordert wurde
      if (data.emailChangeRequested) {
        setEmailChangeRequested(true);
        toast({
          title: "E-Mail-Änderung angefordert",
          description: "Wir haben einen Bestätigungslink an Ihre aktuelle E-Mail-Adresse gesendet. Bitte überprüfen Sie Ihr E-Mail-Postfach, um die Änderung zu bestätigen.",
          variant: "default",
        });
      } else {
        // Nur Name wurde aktualisiert, Session aktualisieren
        await update({
          ...session,
          user: {
            ...session?.user,
            name: profileForm.name,
          },
        });

        toast({
          title: "Profil aktualisiert",
          description: "Ihre Profilinformationen wurden erfolgreich aktualisiert.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Profils:', error);
      toast({
        title: "Fehler",
        description: error.message || "Beim Aktualisieren Ihres Profils ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Passwort ändern
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setPasswordErrors({
            ...passwordErrors,
            currentPassword: 'Aktuelles Passwort ist falsch',
          });
          throw new Error('Aktuelles Passwort ist falsch');
        }
        throw new Error(data.error || 'Fehler beim Ändern des Passworts');
      }

      toast({
        title: "Passwort geändert",
        description: "Ihr Passwort wurde erfolgreich aktualisiert.",
        variant: "default",
      });

      // Passwort-Formular zurücksetzen
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Fehler beim Ändern des Passworts:', error);
      
      // Nur wenn der Fehler nicht bereits im Formular angezeigt wird
      if (!error.message.includes('Aktuelles Passwort ist falsch')) {
        toast({
          title: "Fehler",
          description: error.message || "Beim Ändern Ihres Passworts ist ein Fehler aufgetreten.",
          variant: "destructive",
        });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="container py-8">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Konto-Einstellungen</h1>
          
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="security">Sicherheit</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Profilinformationen
                  </CardTitle>
                  <CardDescription>
                    Verwalten Sie Ihre persönlichen Daten und wie diese angezeigt werden
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {emailChangeRequested && (
                    <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
                      <Info className="h-4 w-4" />
                      <AlertTitle>E-Mail-Änderung ausstehend</AlertTitle>
                      <AlertDescription>
                        Wir haben einen Bestätigungslink an Ihre aktuelle E-Mail-Adresse gesendet. 
                        Bitte überprüfen Sie Ihr E-Mail-Postfach, um die Änderung zu bestätigen.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <form onSubmit={updateProfile} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        placeholder="Ihr Name"
                      />
                      {profileErrors.name && (
                        <span className="text-destructive text-sm">{profileErrors.name}</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail-Adresse</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="ihre.email@beispiel.de"
                      />
                      {profileErrors.email && (
                        <span className="text-destructive text-sm">{profileErrors.email}</span>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Wenn Sie Ihre E-Mail-Adresse ändern, erhalten Sie einen Bestätigungslink an Ihre aktuelle E-Mail-Adresse.
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isUpdatingProfile}
                      className="mt-2"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                          Wird aktualisiert...
                        </>
                      ) : "Profil speichern"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Key className="mr-2 h-5 w-5" />
                    Passwort ändern
                  </CardTitle>
                  <CardDescription>
                    Aktualisieren Sie regelmäßig Ihr Passwort, um die Sicherheit Ihres Kontos zu gewährleisten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={changePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        placeholder="Geben Sie Ihr aktuelles Passwort ein"
                      />
                      {passwordErrors.currentPassword && (
                        <span className="text-destructive text-sm">{passwordErrors.currentPassword}</span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Neues Passwort</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        placeholder="Geben Sie ein neues Passwort ein"
                      />
                      {passwordErrors.newPassword && (
                        <span className="text-destructive text-sm">{passwordErrors.newPassword}</span>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Das Passwort muss mindestens 8 Zeichen lang sein.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        placeholder="Bestätigen Sie Ihr neues Passwort"
                      />
                      {passwordErrors.confirmPassword && (
                        <span className="text-destructive text-sm">{passwordErrors.confirmPassword}</span>
                      )}
                    </div>
                    
                    {passwordErrors.general && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Fehler</AlertTitle>
                        <AlertDescription>{passwordErrors.general}</AlertDescription>
                      </Alert>
                    )}
                    
                    <Button 
                      type="submit" 
                      disabled={isUpdatingPassword}
                      className="mt-2"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                          Wird aktualisiert...
                        </>
                      ) : "Passwort ändern"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
