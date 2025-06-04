'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

// Diese Komponente nutzt useSearchParams() und muss deshalb in Suspense eingewickelt werden
function AccountActivationContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Hier wird useSearchParams() verwendet
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending'|'success'|'error'>('pending');
  const [formData, setFormData] = useState({
    email: searchParams?.get('email') || '',
    code: searchParams?.get('code') || '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [companyName, setCompanyName] = useState<string | null>(null);

  // Verifiziere den Code, wenn er über die URL Parameter übergeben wurde
  useEffect(() => {
    const code = searchParams?.get('code');
    const email = searchParams?.get('email');
    
    if (code && email) {
      verifyInvitationCode(email, code);
    }
  }, [searchParams]);
  
  const verifyInvitationCode = async (email: string, code: string) => {
    setIsVerifying(true);
    try {
      const response = await fetch(`/api/auth/verify-invitation?email=${encodeURIComponent(email)}&code=${code}`);
      const data = await response.json();
      
      if (response.ok) {
        setCompanyName(data.companyName);
        setVerificationStatus('success');
      } else {
        setVerificationStatus('error');
        toast({
          title: 'Fehler',
          description: data.error || 'Der Einladungscode konnte nicht verifiziert werden',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setVerificationStatus('error');
      toast({
        title: 'Fehler',
        description: 'Bei der Überprüfung des Codes ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Fehler zurücksetzen, wenn der Benutzer das Feld ändert
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'E-Mail ist erforderlich';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Ungültiges E-Mail-Format';
    }
    
    if (!formData.code.trim()) {
      newErrors.code = 'Einladungscode ist erforderlich';
    }
    
    if (!formData.password) {
      newErrors.password = 'Passwort ist erforderlich';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Das Passwort muss mindestens 8 Zeichen lang sein';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwortbestätigung ist erforderlich';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Die Passwörter stimmen nicht überein';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Sende Aktivierungsanfrage:', {
        email: formData.email,
        code: formData.code,
        passwordLength: formData.password.length
      });
      
      // Stelle sicher, dass die E-Mail und der Code korrekt formatiert sind
      const cleanEmail = formData.email.trim().toLowerCase();
      const cleanCode = formData.code.trim().toUpperCase();
      
      const response = await fetch('/api/auth/activate-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          code: cleanCode,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      console.log('Aktivierungsantwort:', {
        status: response.status,
        success: response.ok,
        ...data
      });
      
      if (response.ok) {
        toast({
          title: 'Erfolg',
          description: 'Ihr Konto wurde erfolgreich aktiviert. Sie können sich jetzt anmelden.',
        });
        
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        // Spezifische Fehlerbehandlung basierend auf der Fehlerursache
        let errorMessage = data.error || 'Die Kontoaktivierung ist fehlgeschlagen';
        
        if (data.error && data.error.includes('bereits aktiviert')) {
          errorMessage = 'Dieses Konto wurde bereits aktiviert. Sie können sich direkt anmelden.';
          
          // Automatisch zur Login-Seite umleiten
          setTimeout(() => {
            router.push('/auth/login');
          }, 3000);
        }
        
        toast({
          title: response.status === 400 ? 'Hinweis' : 'Fehler',
          description: errorMessage,
          variant: response.status === 400 && data.error?.includes('bereits aktiviert') ? 'default' : 'destructive',
        });
      }
    } catch (error) {
      console.error('Aktivierungsfehler:', error);
      toast({
        title: 'Fehler',
        description: 'Bei der Aktivierung Ihres Kontos ist ein Fehler aufgetreten',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyCode = async () => {
    if (!formData.email || !formData.code) {
      setErrors({
        ...(formData.email ? {} : { email: 'E-Mail ist erforderlich' }),
        ...(formData.code ? {} : { code: 'Einladungscode ist erforderlich' }),
      });
      return;
    }
    
    await verifyInvitationCode(formData.email, formData.code);
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Konto aktivieren</CardTitle>
          <CardDescription className="text-center">
            Aktivieren Sie Ihr Konto und setzen Sie Ihr Passwort
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {verificationStatus === 'success' && companyName && (
              <div className="bg-green-50 p-3 rounded-md border border-green-200 mb-4">
                <p className="text-green-700 text-sm">
                  <span className="font-medium">Einladung bestätigt!</span> Sie können nun ein Passwort für Ihren Administrator-Account bei <strong>{companyName}</strong> festlegen.
                </p>
              </div>
            )}
            
            {verificationStatus === 'error' && (
              <div className="bg-red-50 p-3 rounded-md border border-red-200 mb-4">
                <p className="text-red-700 text-sm">
                  <span className="font-medium">Ungültiger Code!</span> Der Einladungscode ist ungültig oder abgelaufen. Bitte überprüfen Sie Ihre Eingabe oder kontaktieren Sie den Support.
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                disabled={verificationStatus === 'success'}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="code">Einladungscode</Label>
              <div className="flex space-x-2">
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  disabled={verificationStatus === 'success'}
                  className={`flex-grow ${errors.code ? 'border-red-500' : ''}`}
                />
                {verificationStatus === 'pending' && (
                  <Button 
                    type="button" 
                    onClick={handleVerifyCode} 
                    disabled={isVerifying}
                    variant="outline"
                  >
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Prüfen'}
                  </Button>
                )}
              </div>
              {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
            </div>
            
            {verificationStatus === 'success' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
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
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
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
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            {verificationStatus === 'success' && (
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Konto wird aktiviert...
                  </>
                ) : (
                  verificationStatus === 'success' && formData.password && formData.confirmPassword ? 
                    'Konto aktivieren' : 'Passwort festlegen'
                )}
              </Button>
            )}
            
            <div className="text-center text-sm">
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
                Zurück zum Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// Hauptkomponente, die AccountActivationContent mit Suspense umhüllt
export default function ActivateAccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden...</div>}>
      <AccountActivationContent />
    </Suspense>
  );
}
