import React from 'react';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Anmelden | Meditec Umfragen',
  description: 'Melden Sie sich bei Meditec Umfragen an',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Anmelden
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Oder{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:text-primary/80">
              erstellen Sie ein neues Konto
            </Link>
          </p>
        </div>
        
        <div className="mt-8">
          <LoginForm />
        </div>
        
        <div className="text-center mt-4">
          <Link href="/auth/forgot-password" className="text-sm text-gray-600 hover:text-primary">
            Passwort vergessen?
          </Link>
        </div>
      </div>
    </div>
  );
}
