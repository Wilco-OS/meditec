'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export const LoginForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Bitte E-Mail und Passwort eingeben');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Überprüfen, ob es sich um eine Meditec-E-Mail handelt
      const isMeditecAdmin = email.toLowerCase().endsWith('@meditec-online.com');
      
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError('Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.');
        return;
      }
      
      // Erfolgreich angemeldet: Umleitung zum entsprechenden Dashboard
      console.log('Anmeldung erfolgreich, leite weiter...');
      
      // Direktes Umleiten mit window.location für zuverlässigere Navigation
      if (isMeditecAdmin) {
        window.location.href = '/admin/dashboard';
      } else {
        // Für Unternehmensadmins und Mitarbeiter
        window.location.href = '/company/dashboard';
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Bei der Anmeldung ist ein Fehler aufgetreten.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          E-Mail-Adresse
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
        />
      </div>

      <div>
        <Button
          type="submit"
          className="w-full flex justify-center py-2 px-4"
          disabled={isLoading}
        >
          {isLoading ? 'Anmelden...' : 'Anmelden'}
        </Button>
      </div>
    </form>
  );
};
