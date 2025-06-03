'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SurveyDebugger } from '@/components/debug/SurveyDebugger';
import MainLayout from '@/components/layout/MainLayout';

export default function DebugPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user.role !== 'meditec_admin') {
      router.push('/');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="container py-10">
          <div className="text-center">Laden...</div>
        </div>
      </MainLayout>
    );
  }

  if (!session || session.user.role !== 'meditec_admin') {
    return null; // Will redirect in useEffect
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Entwicklungswerkzeuge</h1>
        <p className="mb-6 text-gray-600">
          Diese Seite enthält Werkzeuge zur Fehlerdiagnose und Entwicklung. Sie ist nur für Administratoren zugänglich.
        </p>
        
        <div className="grid gap-6">
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
            <h2 className="text-yellow-800 font-medium">Hinweis</h2>
            <p className="text-yellow-700">Diese Werkzeuge sind nur für Entwicklungs- und Testzwecke gedacht.</p>
          </div>
          
          <SurveyDebugger />
        </div>
      </div>
    </MainLayout>
  );
}
