import { Inter } from 'next/font/google';
import AuthProvider from '@/providers/SessionProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Meditec Pulse Survey',
  description: 'Plattform für effiziente Unternehmensumfragen und detaillierte Auswertungen',
  keywords: ['Umfragen', 'Feedback', 'Unternehmen', 'Meditec', 'Pulse Survey'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
