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
import { Building, Search, Edit, Trash2, Plus, Users } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

interface Company {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone?: string;
  city: string;
  active: boolean;
  createdAt: string;
  employeeCount?: number;
  adminCount?: number;
}

export default function CompaniesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Unternehmen laden
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'meditec_admin') {
      fetchCompanies();
    } else if (status === 'authenticated' && session?.user?.role !== 'meditec_admin') {
      // Weiterleitung, falls kein Admin
      router.push('/');
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Berechtigung, auf diese Seite zuzugreifen.",
        variant: "destructive",
      });
    }
  }, [status, session, pagination.page, searchQuery]);

  // Unternehmen vom Server abrufen
  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const response = await fetch(`/api/companies?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Unternehmen');
      }
      
      const data = await response.json();
      setCompanies(data.companies);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Fehler beim Laden der Unternehmen:', error);
      toast({
        title: "Fehler",
        description: "Die Unternehmen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Unternehmen löschen
  const handleDeleteCompany = async () => {
    if (!deleteCompanyId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/companies/${deleteCompanyId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Löschen des Unternehmens');
      }
      
      setCompanies(companies.filter(company => company._id !== deleteCompanyId));
      toast({
        title: "Erfolg",
        description: "Das Unternehmen wurde erfolgreich gelöscht.",
      });
    } catch (error: any) {
      console.error('Fehler beim Löschen des Unternehmens:', error);
      toast({
        title: "Fehler",
        description: error.message || "Das Unternehmen konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteCompanyId(null);
    }
  };

  // Lösch-Dialog öffnen
  const openDeleteDialog = (id: string) => {
    setDeleteCompanyId(id);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({...pagination, page: 1});
    fetchCompanies();
  };

  // Navigation zu anderer Seite
  const handlePageChange = (newPage: number) => {
    setPagination({...pagination, page: newPage});
  };

  if (status === 'loading' || (status === 'authenticated' && session?.user?.role !== 'meditec_admin')) {
    return (
      <MainLayout>
        <div className="container py-10">
          <h1 className="text-2xl font-bold mb-6">Unternehmensverwaltung</h1>
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
          <h1 className="text-2xl font-bold">Unternehmensverwaltung</h1>
          <Link href="/admin/companies/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neues Unternehmen
            </Button>
          </Link>
        </div>

        {/* Suchleiste */}
        <form onSubmit={handleSearch} className="flex mb-6 gap-2">
          <Input
            type="text"
            placeholder="Nach Unternehmensname oder Stadt suchen..."
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
            <CardTitle>Unternehmen</CardTitle>
            <CardDescription>
              Verwalten Sie die registrierten Unternehmen und deren Benutzer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full" />
                ))}
              </div>
            ) : companies.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Kontakt</TableHead>
                        <TableHead>Stadt</TableHead>
                        <TableHead>Benutzer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company) => (
                        <TableRow key={company._id}>
                          <TableCell className="font-medium">
                            <Link href={`/admin/companies/${company._id}`} className="hover:underline text-blue-600">
                              {company.name}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div>{company.contactPerson}</div>
                            <div className="text-sm text-muted-foreground">{company.email}</div>
                          </TableCell>
                          <TableCell>{company.city}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>
                                {company.employeeCount ?? 0} Mitarbeiter, {company.adminCount ?? 0} Admins
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${company.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {company.active ? 'Aktiv' : 'Inaktiv'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Link href={`/admin/companies/${company._id}/edit`}>
                                <Button variant="outline" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/companies/${company._id}/users`}>
                                <Button variant="outline" size="icon">
                                  <Users className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="icon" onClick={() => openDeleteDialog(company._id)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Unternehmen löschen</DialogTitle>
                                    <DialogDescription>
                                      Möchten Sie das Unternehmen "{company.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Abbrechen</Button>
                                    </DialogClose>
                                    <Button
                                      variant="destructive"
                                      onClick={handleDeleteCompany}
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
                <Building className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Keine Unternehmen gefunden</h3>
                <p className="text-muted-foreground mt-2">
                  {searchQuery
                    ? 'Es wurden keine Unternehmen gefunden, die Ihren Suchkriterien entsprechen.'
                    : 'Es wurden noch keine Unternehmen erstellt.'}
                </p>
                <Link href="/admin/companies/create">
                  <Button className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Unternehmen erstellen
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
