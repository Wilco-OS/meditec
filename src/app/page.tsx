'use client';

import React from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import MainLayout from '@/components/layout/MainLayout';

export default function HomePage() {
  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          <div className="text-center">
            {/* Logo als Text */}
            <div className="flex justify-center mb-6">
              <h1 className="text-3xl font-bold text-primary">
                MEDITEC
              </h1>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Meditec Pulse Survey
            </h1>
            <p className="text-sm text-gray-600 mb-6">
              Mitarbeiterumfragen einfach verwalten
            </p>
          </div>
          
          <div className="mt-6">
            <LoginForm />
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="text-center mb-4">
              <h2 className="text-sm font-medium text-gray-700">Haben Sie einen Einladungscode?</h2>
            </div>
            <a 
              href="/auth/register" 
              className="w-full flex justify-center py-2 px-4 border border-primary rounded-md shadow-sm text-sm font-medium text-primary bg-white hover:bg-primary hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Mit Einladungscode registrieren
            </a>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} Meditec. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
