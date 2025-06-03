'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Image from 'next/image';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface InvitationResponse {
  valid: boolean;
  user?: {
    name: string;
    email: string;
  };
  message?: string;
}

export default function InvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<InvitationResponse | null>(null);
  
  // Einladungstoken überprüfen
  useEffect(() => {
    if (!token) {
      setInvitationInfo({
        valid: false,
        message: "Kein Token gefunden. Bitte überprüfen Sie den Link."
      });
      setLoading(false);
      return;
    }

    const verifyInvitation = async () => {
      try {
        const response = await fetch(`/api/invitation/verify?token=${token}`);
        const data = await response.json();
        
        setInvitationInfo(data);
        
        if (!data.valid) {
          toast({
            title: "Ungültiger Einladungslink",
            description: data.message || "Der Einladungslink ist ungültig oder abgelaufen.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Fehler beim Überprüfen der Einladung:', error);
        setInvitationInfo({
          valid: false,
          message: "Es ist ein Fehler beim Überprüfen der Einladung aufgetreten."
        });
      } finally {
        setLoading(false);
      }
    };
    
    verifyInvitation();
  }, [token, toast]);
  
  // Form-Validierung
  const validateForm = () => {
    setError('');
    
    if (password.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return false;
    }
    
    return true;
  };
  
  // Passwort-Erstellung
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('/api/invitation/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Setzen des Passworts');
      }
      
      toast({
        title: "Passwort festgelegt",
        description: "Ihr Passwort wurde erfolgreich festgelegt. Sie können sich jetzt anmelden.",
        variant: "default",
      });
      
      // Zur Login-Seite weiterleiten
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Fehler beim Einrichten des Kontos:', error);
      toast({
        title: "Fehler",
        description: error.message || "Beim Einrichten Ihres Kontos ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // Lade-Zustand anzeigen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-semibold">Einladung wird überprüft</CardTitle>
            <CardDescription>Bitte warten Sie einen Moment...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Ungültige Einladung
  if (!invitationInfo?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-xl font-semibold text-destructive">Ungültiger Einladungslink</CardTitle>
            <CardDescription>{invitationInfo?.message || "Der Einladungslink ist ungültig oder abgelaufen."}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/')}>Zur Startseite</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Passwort-Formular
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Passwort einrichten</CardTitle>
          <CardDescription className="mt-2">
            Willkommen, {invitationInfo?.user?.name}! Bitte legen Sie Ihr Passwort fest, um Ihr Konto zu aktivieren.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                value={invitationInfo?.user?.email || ''}
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Passwort wiederholen"
                required
                autoComplete="new-password"
              />
            </div>
            
            {error && (
              <div className="text-sm text-destructive mt-2">{error}</div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Wird verarbeitet...
                </>
              ) : "Passwort festlegen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
