'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Search, Edit, Trash2, Plus, User, CheckCircle, XCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'meditec_admin' | 'company_admin' | 'employee';
  active: boolean;
  createdAt: string;
  emailVerified?: boolean;
}

export default function CompanyUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Benutzer laden
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'company_admin') {
        fetchUsers();
      } else {
        // Weiterleitung, falls kein Unternehmensadmin
        router.push('/');
        toast({
          title: "Zugriff verweigert",
          description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
          variant: "destructive",
        });
      }
    }
  }, [status, session, pagination.page, searchQuery]);

  // Benutzer vom Server abrufen
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      queryParams.append('role', 'employee'); // Nur Mitarbeiter anzeigen
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      // Company ID muss nicht gesetzt werden, da der API-Endpunkt automatisch die
      // Benutzer des Unternehmens des eingeloggten Company-Admins zurückgibt
      
      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Benutzer');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
      toast({
        title: "Fehler",
        description: "Die Benutzer konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Benutzer löschen
  const handleDeleteUser = async () => {
    if (!deleteUserId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${deleteUserId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen des Benutzers');
      }
      
      setUsers(users.filter(user => user._id !== deleteUserId));
      toast({
        title: "Erfolg",
        description: "Der Benutzer wurde erfolgreich gelöscht.",
      });
    } catch (error: any) {
      console.error('Fehler beim Löschen des Benutzers:', error);
      toast({
        title: "Fehler",
        description: error.message || "Der Benutzer konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteUserId(null);
    }
  };

  // Lösch-Dialog öffnen
  const openDeleteDialog = (id: string) => {
    setDeleteUserId(id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({...pagination, page: 1});
    fetchUsers();
  };

  // Navigation zu anderer Seite
  const handlePageChange = (newPage: number) => {
    setPagination({...pagination, page: newPage});
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'company_admin')) {
    return (
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-2xl font-bold mb-6">Mitarbeiterverwaltung</h1>
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-40" />
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-7 w-40 mb-2" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mitarbeiterverwaltung</h1>
          <Link href="/company/users/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Mitarbeiter
            </Button>
          </Link>
        </div>

        {/* Suchleiste */}
        <form onSubmit={handleSearch} className="flex mb-6 gap-2">
          <Input
            type="text"
            placeholder="Nach Name oder E-Mail suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" variant="outline">
            <Search className="h-4 w-4 mr-2" />
            Suchen
          </Button>
        </form>

        <Card>
          <CardHeader>
            <CardTitle>Mitarbeiter</CardTitle>
            <CardDescription>
              Verwalten Sie die Mitarbeiter Ihres Unternehmens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {user.active ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mr-2" />
                              )}
                              <span>{user.active ? 'Aktiv' : 'Inaktiv'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Link href={`/company/users/${user._id}/edit`}>
                                <Button variant="outline" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    onClick={() => openDeleteDialog(user._id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Benutzer löschen</DialogTitle>
                                    <DialogDescription>
                                      Möchten Sie den Benutzer "{user.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Abbrechen</Button>
                                    </DialogClose>
                                    <Button
                                      variant="destructive"
                                      onClick={handleDeleteUser}
                                      disabled={isDeleting}
                                    >
                                      {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        Zurück
                      </Button>
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={pagination.page === page ? "default" : "outline"}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                      >
                        Weiter
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-10">
                <User className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Keine Mitarbeiter gefunden</h3>
                <p className="text-muted-foreground mt-2">
                  {searchQuery
                    ? 'Es wurden keine Mitarbeiter gefunden, die Ihren Suchkriterien entsprechen.'
                    : 'Es wurden noch keine Mitarbeiter erstellt.'}
                </p>
                <Link href="/company/users/new">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Mitarbeiter hinzufügen
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
