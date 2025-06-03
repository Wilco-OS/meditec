'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export const RegistrationForm = () => {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Einladungscode, 2: Registrierung
  const [invitationCode, setInvitationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyInfo, setCompanyInfo] = useState<{ id: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Validiert den Einladungscode direkt gegen die MongoDB-Datenbank (ohne E-Mail-Versand)
  const validateInvitationCode = async () => {
    if (!invitationCode) {
      setError('Bitte geben Sie einen Einladungscode ein');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // API-Aufruf zur Validierung des Einladungscodes
      const response = await fetch(`/api/invitations/validate?code=${invitationCode.trim().toUpperCase()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Einladungscode konnte nicht validiert werden');
      }

      if (data.usedAt) {
        throw new Error('Dieser Einladungscode wurde bereits verwendet');
      }

      // Einladungscode ist gültig
      setCompanyInfo({
        id: data.companyId, // Verwende companyId statt id
        name: data.companyName
      });
      
      // E-Mail aus der Einladung verwenden
      if (data.email) {
        setEmail(data.email);
      }
      
      // Zum nächsten Schritt wechseln
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Bei der Validierung ist ein Fehler aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  // Registriert den Benutzer ohne E-Mail-Bestätigung
  const registerUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!companyInfo) {
      setError('Bitte validieren Sie zuerst den Einladungscode');
      return;
    }

    if (!email || !password || !confirmPassword) {
      setError('Bitte füllen Sie alle Felder aus');
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Direkter API-Aufruf zur Registrierung
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          invitationCode: invitationCode.trim().toUpperCase(),
          companyId: companyInfo.id,
          role: 'company_admin', // Administrator des Unternehmens
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registrierung fehlgeschlagen');
      }

      // Nach erfolgreicher Registrierung automatisch anmelden
      const signInResult = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.error) {
        // Wenn die Anmeldung fehlschlägt, zur Anmeldeseite weiterleiten
        router.push('/auth/login');
      } else {
        // Bei erfolgreicher Anmeldung zum Dashboard weiterleiten
        router.push('/company/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Bei der Registrierung ist ein Fehler aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      {step === 1 ? (
        // Schritt 1: Einladungscode-Validierung
        <div className="space-y-6">
          <div>
            <label htmlFor="invitationCode" className="block text-sm font-medium text-gray-700">
              Einladungscode
            </label>
            <input
              id="invitationCode"
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
              placeholder="z.B. ABCDEF"
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Sie sollten einen Einladungscode von Ihrem Unternehmen erhalten haben.
            </p>
          </div>

          <Button
            type="button"
            onClick={validateInvitationCode}
            className="w-full"
            disabled={isLoading || !invitationCode.trim()}
          >
            {isLoading ? 'Validiere...' : 'Code validieren'}
          </Button>
        </div>
      ) : (
        // Schritt 2: Registrierung
        <form onSubmit={registerUser} className="space-y-6">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm font-medium">
              Einladungscode validiert für: {companyInfo?.name}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              readOnly
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 text-sm"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Registriere...' : 'Registrieren'}
          </Button>
        </form>
      )}
    </div>
  );
};
