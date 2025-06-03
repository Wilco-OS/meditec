'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * SessionProvider-Wrapper für NextAuth
 * Ermöglicht die Verwendung des useSession-Hooks in Client-Komponenten
 */
export default function AuthProvider({ children }: AuthProviderProps) {
  return <SessionProvider>{children}</SessionProvider>;
}
