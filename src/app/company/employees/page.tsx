'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// UI-Komponenten
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { UserPlus, UserX, Edit, Mail } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

// Typen für Mitarbeiter
type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  department?: string;
  createdAt: string;
};

export default function CompanyEmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchEmployees();
    }
  }, [session, status]);

  // Mitarbeiter abrufen
  const fetchEmployees = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/company/employees');
      
      if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Mitarbeiter');
      }
      
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Fehler beim Laden der Mitarbeiter:', error);
      toast({
        title: 'Fehler',
        description: 'Die Mitarbeiter konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mitarbeiter(de)aktivieren
  const toggleEmployeeStatus = async (employeeId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/company/employees/${employeeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      });
      
      if (!response.ok) {
        throw new Error(`Fehler beim ${active ? 'Aktivieren' : 'Deaktivieren'} des Mitarbeiters`);
      }
      
      // Erfolgreich aktualisiert - Liste neu laden
      fetchEmployees();
      
      toast({
        title: 'Erfolg',
        description: `Mitarbeiter wurde erfolgreich ${active ? 'aktiviert' : 'deaktiviert'}.`,
      });
    } catch (error) {
      console.error('Fehler beim Ändern des Mitarbeiterstatus:', error);
      toast({
        title: 'Fehler',
        description: 'Der Status des Mitarbeiters konnte nicht geändert werden.',
        variant: 'destructive',
      });
    }
  };

  // Laden-Status anzeigen
  if (status === 'loading' || !session) {
    return (
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-3xl font-bold mb-6">Mitarbeiterverwaltung</h1>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mitarbeiterverwaltung</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Ihre Mitarbeiter und Administratoren
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/company/employees/invite">
                <UserPlus className="mr-2 h-4 w-4" />
                Mitarbeiter einladen
              </Link>
            </Button>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Mitarbeiterliste</CardTitle>
            <CardDescription>
              Übersicht über alle Mitarbeiter und Administratoren Ihres Unternehmens
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-4">
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full mb-2" />
                <Skeleton className="h-10 w-full mb-2" />
              </div>
            ) : employees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Rolle</TableHead>
                    <TableHead>Abteilung</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        {employee.role === 'company_admin' ? (
                          <Badge variant="default">Administrator</Badge>
                        ) : (
                          <Badge variant="outline">Mitarbeiter</Badge>
                        )}
                      </TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell>
                        {employee.active ? (
                          <Badge variant="success">Aktiv</Badge>
                        ) : (
                          <Badge variant="destructive">Inaktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!employee.active ? (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleEmployeeStatus(employee.id, true)}
                            >
                              Aktivieren
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700"
                              onClick={() => toggleEmployeeStatus(employee.id, false)}
                            >
                              <UserX className="h-4 w-4 mr-1" /> Deaktivieren
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>Keine Mitarbeiter gefunden.</p>
                <p className="mt-2">
                  <Button variant="link" asChild>
                    <Link href="/company/employees/invite">Laden Sie Ihre ersten Mitarbeiter ein</Link>
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
