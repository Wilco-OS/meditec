import React from 'react';
import Link from 'next/link';
import { RegistrationForm } from '@/components/auth/RegistrationForm';

export const metadata = {
  title: 'Registrieren | Meditec Umfragen',
  description: 'Registrieren Sie sich bei Meditec Umfragen',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">
            Konto erstellen
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Oder{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              melden Sie sich mit Ihrem bestehenden Konto an
            </Link>
          </p>
        </div>
        
        <div className="mt-8">
          <RegistrationForm />
        </div>
      </div>
    </div>
  );
}
